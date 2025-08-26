// evals.js
// Usage: node evals.js

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.FORMFILL_URL || 'http://localhost:3000/api/formfill';
const TIMEOUT = Number(process.env.EVAL_TIMEOUT_MS || 60000);
const STRICT = (process.env.STRICT || 'true').toLowerCase() === 'true';

const INPUT_DIR = path.join(__dirname, 'input');
const UPLOADS_DIR = path.join(INPUT_DIR, 'uploads');
const FORM_FIELDS_PATH = path.join(INPUT_DIR, 'formfields.json');
const INSTRUCTION_PATH = path.join(INPUT_DIR, 'instruction.txt');
const IMPORTANT_PATH = path.join(INPUT_DIR, 'important.txt');
const RESULTS_DIR = path.join(__dirname, 'results');

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const readIf = (p) => {
  try {
    return fs.readFileSync(p, 'utf8').trim();
  } catch {
    return '';
  }
};
const listFiles = (dir) => {
  try {
    return fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile());
  } catch {
    return [];
  }
};
const slug = (s) => s.replace(/[^\w.-]+/g, '_');

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
  if (typeof a === 'string' && typeof b === 'string')
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  return String(a).trim() === String(b).trim();
};

const looseEq = (a, b) => {
  const sa = String(a).trim().toLowerCase(),
    sb = String(b).trim().toLowerCase();
  if (sa === sb) return true;
  const na = Number(sa.replace(/[^\d.-]/g, '')),
    nb = Number(sb.replace(/[^\d.-]/g, ''));
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return Math.abs(na - nb) < 1e-6;
  const nu = (s) => s.replace(/\/+$/, '');
  if (sa.startsWith('http') && sb.startsWith('http')) return nu(sa) === nu(sb);
  return false;
};

const compare = (expected, got) => {
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

async function postFormFill({ instruction, important, formFields, filePath }) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT);
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
    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(t);
  }
}

(async () => {
  if (!fs.existsSync(FORM_FIELDS_PATH)) {
    console.error('Missing input/formfields.json');
    process.exit(1);
  }
  ensureDir(RESULTS_DIR);

  let formFields;
  try {
    formFields = JSON.parse(fs.readFileSync(FORM_FIELDS_PATH, 'utf8'));
  } catch {
    console.error('Invalid JSON in input/formfields.json');
    process.exit(1);
  }
  const instruction = readIf(INSTRUCTION_PATH);
  const important = readIf(IMPORTANT_PATH);

  const all = listFiles(UPLOADS_DIR);
  const pdfs = all
    .filter((f) => !f.toLowerCase().endsWith('.json'))
    .map((f) => path.join(UPLOADS_DIR, f));
  if (pdfs.length === 0) {
    console.error('No files in input/uploads');
    process.exit(1);
  }

  console.log(
    `Running ${pdfs.length} eval${pdfs.length > 1 ? 's' : ''} → ${API_URL} (STRICT=${STRICT})\n`,
  );
  const results = [];
  let sum = 0,
    counted = 0;

  for (const filePath of pdfs) {
    const base = path.basename(filePath);
    const expectedPath = path.join(UPLOADS_DIR, base.replace(/\.[^.]+$/, '') + '.json');
    process.stdout.write(`• ${base} … `);

    let expected = null;
    if (fs.existsSync(expectedPath)) {
      try {
        expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
      } catch {
        expected = null;
      }
    }

    try {
      const res = await postFormFill({ instruction, important, formFields, filePath });
      const got = res.json?.data ?? {};
      let cmp = null,
        pct = null;
      if (expected && Object.keys(expected).length) {
        cmp = compare(expected, got);
        pct = Math.round(cmp.score * 100);
        if (!Number.isNaN(cmp.score)) {
          sum += cmp.score;
          counted++;
        }
      }
      const out = {
        file: base,
        ok: res.ok,
        status: res.status,
        expected_present: Boolean(expected),
        percent: pct,
        compare: cmp,
        response: res.json,
      };
      fs.writeFileSync(path.join(RESULTS_DIR, `${slug(base)}.json`), JSON.stringify(out, null, 2));
      console.log(res.ok ? (pct !== null ? `${pct}%` : 'OK') : `HTTP ${res.status}`);
      results.push(out);
    } catch (e) {
      const out = { file: base, ok: false, status: 'ERR', error: String(e) };
      fs.writeFileSync(path.join(RESULTS_DIR, `${slug(base)}.json`), JSON.stringify(out, null, 2));
      console.log('ERROR');
      results.push(out);
    }
  }

  const avg = counted ? Math.round((sum / counted) * 100) : null;
  const summary = {
    total_files: pdfs.length,
    with_expected: counted,
    average_percent: avg,
    STRICT,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(RESULTS_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\nDone. Avg${avg === null ? ': n/a' : `: ${avg}%`} • Results in: ${RESULTS_DIR}`);
})();
