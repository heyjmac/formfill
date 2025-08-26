// evals.js
// Usage:
//   node evals.js
// Env:
//   FORMFILL_URL=http://localhost:3000/api/formfill
//   EVAL_TIMEOUT_MS=60000
//
// Folder layout (create this next to evals.js):
// input/
//   formfields.json          ← required
//   instruction.txt          ← optional
//   important.txt            ← optional
//   pasted.txt               ← optional (used for the special "pasted-only" case)
//   uploads/                 ← files to test, one per request
// output/
//   results/                 ← per-file results will be saved here
//
// Notes:
// - Runs one request per file in input/uploads (sequential).
// - Also runs a "pasted-only" eval if input/pasted.txt exists (no files).
// - Saves individual results to output/results/<case>.json and a summary to output/summary.json.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Config ----------
const API_URL = process.env.FORMFILL_URL || 'http://localhost:3000/api/formfill';
const DEFAULT_TIMEOUT_MS = Number(process.env.EVAL_TIMEOUT_MS || 60000);

// ---------- Paths ----------
const INPUT_DIR = path.join(__dirname, 'input');
const UPLOADS_DIR = path.join(INPUT_DIR, 'uploads');
const FORM_FIELDS_PATH = path.join(INPUT_DIR, 'formfields.json');
const INSTRUCTION_PATH = path.join(INPUT_DIR, 'instruction.txt');
const IMPORTANT_PATH = path.join(INPUT_DIR, 'important.txt');
const PASTED_PATH = path.join(INPUT_DIR, 'pasted.txt');

const OUTPUT_DIR = path.join(__dirname, 'output');
const RESULTS_DIR = path.join(OUTPUT_DIR, 'results');

// ---------- FS helpers ----------
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function readIfExists(p, fallback = '') {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return fallback;
  }
}
function listFilesSafe(dir) {
  try {
    return fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile());
  } catch {
    return [];
  }
}

// ---------- HTTP ----------
async function postFormFill({ instruction, important, formFields, pastedText, filePath }) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const fd = new FormData();
    fd.append('instruction', instruction || '');
    fd.append('important', important || '');
    fd.append('formFields', JSON.stringify(formFields || {}));
    if (pastedText) fd.append('pastedText', pastedText);
    if (filePath) {
      const stream = fs.createReadStream(filePath);
      fd.append('files', stream, path.basename(filePath));
    }
    const res = await fetch(API_URL, { method: 'POST', body: fd, signal: controller.signal });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(t);
  }
}

// ---------- Main ----------
(async () => {
  // Validate inputs and prepare outputs
  if (!fs.existsSync(FORM_FIELDS_PATH)) {
    console.error('Missing input/formfields.json');
    process.exit(1);
  }
  ensureDir(OUTPUT_DIR);
  ensureDir(RESULTS_DIR);

  // Load inputs
  let formFields;
  try {
    formFields = JSON.parse(fs.readFileSync(FORM_FIELDS_PATH, 'utf8'));
  } catch (e) {
    console.error('Invalid JSON in input/formfields.json');
    process.exit(1);
  }
  const instruction = readIfExists(INSTRUCTION_PATH, '').trim();
  const important = readIfExists(IMPORTANT_PATH, '').trim();
  const pastedText = readIfExists(PASTED_PATH, '').trim();

  const files = listFilesSafe(UPLOADS_DIR).map((f) => path.join(UPLOADS_DIR, f));

  // Build cases: one per file + optional pasted-only case
  const cases = [];
  if (pastedText) {
    cases.push({ name: 'pasted-only', filePath: null, pastedText });
  }
  for (const fp of files) {
    cases.push({ name: path.basename(fp), filePath: fp, pastedText: '' });
  }

  if (cases.length === 0) {
    console.error('No eval cases found. Add files to input/uploads or a pasted.txt.');
    process.exit(1);
  }

  console.log(`Running ${cases.length} eval case(s) against ${API_URL}\n`);

  const results = [];
  let okCount = 0;

  for (const c of cases) {
    process.stdout.write(`• ${c.name} … `);
    try {
      const res = await postFormFill({
        instruction,
        important,
        formFields,
        pastedText: c.pastedText,
        filePath: c.filePath,
      });

      const out = {
        case: c.name,
        ok: res.ok,
        status: res.status,
        request: {
          hasFile: Boolean(c.filePath),
          fileName: c.filePath ? path.basename(c.filePath) : null,
          hasPastedText: Boolean(c.pastedText),
        },
        response: res.json || {},
      };

      const dest = path.join(RESULTS_DIR, `${c.name.replace(/[^\w.-]+/g, '_')}.json`);
      fs.writeFileSync(dest, JSON.stringify(out, null, 2));

      if (res.ok) {
        okCount++;
        console.log('OK');
      } else {
        console.log(`FAILED (HTTP ${res.status})`);
      }
      results.push(out);
    } catch (e) {
      const out = { case: c.name, ok: false, status: 'ERR', error: String(e) };
      const dest = path.join(RESULTS_DIR, `${c.name.replace(/[^\w.-]+/g, '_')}.json`);
      fs.writeFileSync(dest, JSON.stringify(out, null, 2));
      console.log('ERROR');
      results.push(out);
    }
  }

  const summary = {
    total_cases: cases.length,
    success: okCount,
    failed: cases.length - okCount,
    success_rate: cases.length ? Math.round((okCount / cases.length) * 100) : 0,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));

  console.log(
    `\nDone. ${summary.success}/${summary.total_cases} succeeded (${summary.success_rate}%).`,
  );
  console.log(`Results in: ${RESULTS_DIR}`);
})();
