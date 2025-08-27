import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const API_URL = 'http://localhost:3000/api/formfill';
const TIMEOUT = 60000;
const STRICT = false;

const GEMINI_PRICING = {
  input: {
    TEXT: 0.1 / 1_000_000,
    IMAGE: 0.1 / 1_000_000,
    VIDEO: 0.1 / 1_000_000,
    AUDIO: 0.3 / 1_000_000,
  },
  output: 0.4 / 1_000_000,
  cache: {
    TEXT: 0.025 / 1_000_000,
    IMAGE: 0.025 / 1_000_000,
    VIDEO: 0.025 / 1_000_000,
    AUDIO: 0.125 / 1_000_000,
  },
};

export const calculateGeminiCosts = (tokens) => {
  const promptCost = tokens?.promptTokensDetails?.reduce((acc, { modality, tokenCount }) => {
    const rate = GEMINI_PRICING.input[modality] || 0;
    return acc + tokenCount * rate;
  }, 0);

  const outputCost = tokens?.candidatesTokenCount * GEMINI_PRICING.output;

  const cacheCost =
    tokens?.cacheTokensDetails?.reduce((acc, { modality, tokenCount }) => {
      const rate = GEMINI_PRICING.cache[modality] || 0;
      return acc + tokenCount * rate;
    }, 0) || 0;

  return {
    promptCost: promptCost.toFixed(6),
    outputCost: outputCost.toFixed(6),
    cacheCost: cacheCost.toFixed(6),
    totalCost: (promptCost + outputCost + cacheCost).toFixed(6),
  };
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const flat = (o, pfx = '') =>
  Object.entries(o || {}).reduce((a, [k, v]) => {
    const key = pfx ? `${pfx}.${k}` : k;
    if (isObj(v)) Object.assign(a, flat(v, key));
    else a[key] = v;
    return a;
  }, {});

const deepEq = (a, b) => {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((x, i) => deepEq(x, b[i]));
  if (isObj(a) && isObj(b)) {
    const ka = Object.keys(a),
      kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => deepEq(a[k], b[k]));
  }
  if (typeof a === 'string' && typeof b === 'string') return a?.trim() === b?.trim();
  return String(a)?.trim() === String(b)?.trim();
};

const looseEq = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;

  const sa = a?.trim().toLowerCase();
  const sb = b?.trim().toLowerCase();

  return sa === sb;
};

export const compare = (expected, got) => {
  const exp = flat(expected),
    g = flat(got || {});
  const keys = Object.keys(exp);
  let correct = 0,
    wrong = 0,
    missing = 0,
    extra = 0;
  const details = [];
  for (const k of keys) {
    if (!(k in g)) {
      missing++;
      details.push({ key: k, ok: false, reason: 'missing', expected: exp[k], got: undefined });
      continue;
    }
    const ok = (STRICT ? deepEq : looseEq)(exp[k], g[k]);
    ok ? correct++ : wrong++;
    details.push({ key: k, ok, expected: exp[k], got: g[k] });
  }
  for (const k of Object.keys(g))
    if (!(k in exp)) {
      extra++;
      details.push({ key: k, ok: !STRICT, reason: 'extra', expected: undefined, got: g[k] });
    }
  const score = keys.length ? correct / keys.length : 0;
  return { score, correct, wrong, missing, extra, total_expected: keys.length, details };
};

const mimeFromExt = (p) => {
  const ext = path.extname(p).toLowerCase();
  const map = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.html': 'text/html',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
  };
  return map[ext] || 'application/octet-stream';
};

const postFormFill = async ({ instruction, important, formFields, filePath }) => {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), TIMEOUT);
  const t0 = process.hrtime.bigint();
  try {
    const fd = new FormData();
    fd.append('instruction', instruction || '');
    fd.append('important', important || '');
    fd.append('formFields', JSON.stringify(formFields || {}));
    if (filePath) {
      const buf = await fs.promises.readFile(filePath);
      const blob = new Blob([buf], { type: mimeFromExt(filePath) });
      fd.append('files', blob, path.basename(filePath));
    }
    const res = await fetch(API_URL, { method: 'POST', body: fd, signal: controller.signal });
    const json = await res.json().catch(() => ({}));
    const t1 = process.hrtime.bigint();
    const latency_ms = Number(t1 - t0) / 1e6;
    const server_timing = res.headers.get('server-timing') || null;
    const x_response_time = res.headers.get('x-response-time') || null;
    return {
      ok: res.ok,
      status: res.status,
      json,
      latency_ms,
      headers: { server_timing, x_response_time },
    };
  } finally {
    clearTimeout(to);
  }
};

const computeMetrics = (expected, actual) => {
  const result = compare(expected, actual);
  const { correct, wrong, missing, extra } = result;

  const tp = correct;
  const fp = wrong + extra;
  const fn = missing;

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    compare: result,
    precision,
    recall,
    f1,
  };
};

export const runEval = async ({
  file,
  fileBuffer,
  formFields,
  instruction,
  important,
  expected,
}) => {
  const fd = new FormData();
  fd.append('formFields', JSON.stringify(formFields));
  fd.append('instruction', instruction);
  fd.append('important', important);
  fd.append('files', new Blob([fileBuffer], { type: file.mimetype }), file.originalname);

  const t0 = Date.now();
  const response = await fetch('http://localhost:3000/api/formfill', {
    method: 'POST',
    body: fd,
  });
  const latency = Date.now() - t0;

  const data = await response.json();
  const got = data?.data ?? {};
  const tokens = data?.tokens ?? {};
  const cost = calculateGeminiCosts(tokens);

  let compareResult = null;
  let precision = null;
  let recall = null;
  let f1 = null;

  if (expected && Object.keys(expected).length) {
    const metrics = computeMetrics(expected, got);
    compareResult = metrics.compare;
    precision = metrics.precision;
    recall = metrics.recall;
    f1 = metrics.f1;
  }

  return {
    file: file.originalname,
    ok: response.ok,
    status: response.status,
    precision,
    recall,
    f1,
    latency_ms: latency,
    total_cost: cost.totalCost,
    compare: compareResult,
    cost,
    tokens,
    response: data,
    timestamp: new Date().toISOString(),
  };
};
