// 1. Imports and Setup
import { createPartFromUri, createUserContent, GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import { compare } from './evals.utils.js';
import { prependImportantToDescriptions } from './utils.js';

dotenv.config();

const SAVE_PROMPT = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 2. Constants and Configs
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024); // 10MB default
const RETRY_LIMIT = Number(process.env.RETRY_LIMIT ?? 1);
const RETRY_DELAY_MS = Number(process.env.RETRY_DELAY_MS ?? 800);

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'text/html',
  'text/markdown',
  'application/json',
  'application/xml',
  'text/xml',
  'image/png',
  'image/jpeg',
  'image/webp',
  'audio/mpeg',
  'audio/wav',
  'video/mp4',
  'video/quicktime',
]);

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const err = new Error('INVALID_FILE_TYPE');
      err.code = 'INVALID_FILE_TYPE';
      return cb(err);
    }
    cb(null, true);
  },
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 3. Middlewares
if (process.env.NODE_ENV !== 'production') {
  const livereload = (await import('livereload')).default;
  const connectLivereload = (await import('connect-livereload')).default;

  const liveReloadServer = livereload.createServer();
  liveReloadServer.watch(path.join(__dirname, 'client/dist'));
  app.use(connectLivereload());

  liveReloadServer.server.once('connection', () => {
    setTimeout(() => liveReloadServer.refresh('/'), 100);
  });
}

const uploadMiddleware = (req, res, next) => {
  upload.array('files')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      let errorResponse = {
        status: 'error',
        message: 'Parsing error',
        errorCode: err.code,
        error: err.message,
        shortError: 'Upload error.',
        tip: 'Check file size and type.',
      };

      if (err.code === 'LIMIT_FILE_SIZE') {
        errorResponse = {
          ...errorResponse,
          error: 'File is too large.',
          shortError: 'File too large.',
          tip: `Max size is ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))}MB. Try a smaller file.`,
        };
      }

      return res.status(400).json(errorResponse);
    }

    next(err);
  });
};

const clientDistPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDistPath));
app.use('/downloads', express.static(path.join(process.cwd(), 'downloads')));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const generateAndParse = async ({ ai, uploadedFiles, pastedText, systemInstructions }) => {
  const response = await ai.models.generateContent({
    model: 'models/gemini-2.5-flash-lite',
    contents: createUserContent([
      `Please extract the relevant information from the following:\n\nPasted text:\n${pastedText || '[none]'}`,
      ...uploadedFiles.map((f) => createPartFromUri(f.uri, f.mimeType)),
    ]),
    config: { systemInstruction: { role: 'system', parts: [{ text: systemInstructions }] } },
  });

  const rawText = response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
  let args;
  try {
    const jsonMatch = rawText.match(/```json([\s\S]*?)```/i);
    args = JSON.parse(jsonMatch ? jsonMatch[1] : rawText);
  } catch {
    args = {};
  }

  const filteredArgs = Object.fromEntries(
    Object.entries(args).filter(([_, v]) => {
      if (!v || v?.length === 0) return false;
      if (typeof v === 'string')
        return !['null', 'undefined', 'none', 'n/a', 'unknown'].includes(v.toLowerCase());
      return true;
    }),
  );

  return { filteredArgs, tokens: response?.usageMetadata };
};

const withRetry = async (taskFn, { limit = RETRY_LIMIT, delayMs = RETRY_DELAY_MS } = {}) => {
  let lastErr;
  for (let attempt = 0; attempt <= limit; attempt++) {
    try {
      return await taskFn();
    } catch (err) {
      lastErr = err;
      if (attempt < limit) await sleep(delayMs);
    }
  }
  throw lastErr;
};

// 5. Endpoints
app.post(
  '/api/formfill',
  uploadMiddleware,
  express.urlencoded({ extended: true }),
  async (req, res) => {
    const start = Date.now();
    const files = req.files || [];
    let formFields = JSON.parse(req.body.formFields || '{}');
    const instruction = req.body.instruction?.trim() || '';
    const important = req.body.important?.trim() || '';
    const pastedText = req.body.pastedText?.trim() || '';

    if (Object.keys(formFields).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Parsing error',
        errorCode: 'NO_FORM_FIELDS_PROVIDED',
        error: 'No form fields were submitted.',
        shortError: 'No form fields provided.',
        tip: 'Please provide the necessary form fields before submitting.',
      });
    }

    if (files.length === 0 && !pastedText) {
      return res.status(400).json({
        status: 'error',
        message: 'Parsing error',
        errorCode: 'NO_INPUT_PROVIDED',
        error: 'No file or pasted text was submitted.',
        shortError: 'No input provided.',
        tip: 'Upload a file or paste some text before submitting.',
      });
    }

    if (SAVE_PROMPT) {
      fs.writeFileSync(
        path.join(__dirname, 'evals', 'input', 'formfields.json'),
        JSON.stringify(formFields, null, 2),
      );
      fs.writeFileSync(path.join(__dirname, 'evals', 'input', 'important.txt'), important);
      fs.writeFileSync(path.join(__dirname, 'evals', 'input', 'instruction.txt'), instruction);
      fs.writeFileSync(path.join(__dirname, 'evals', 'input', 'pasted.txt'), pastedText);
    }

    formFields = prependImportantToDescriptions(formFields, important);
    console.log(formFields);

    // TO-DO: ADD TO S3 AND SAVE REFERENCE IN A DB CONNECTED TO A CONTEXT TO BE PASSED BY THE FRONTEND

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const uploaded = await ai.files.upload({
          file: path.join(file.destination, file.filename),
          config: { mimeType: file.mimetype },
        });
        return {
          name: uploaded.name,
          uri: uploaded.uri,
          mimeType: uploaded.mimeType,
          size: file.size,
        };
      }),
    );

    const systemInstructions = `You are an AI that fills form fields. 
You cannot reply or assist directly. 
You must read the user inputs and return only the values needed to fill the form fields.

You'll receive
- an instruction on how to fill the form fields
- a list of fields accepted by the form with descriptions
- optional text content pasted by the user
- optional files uploaded by the user

The content provided by the user may have information to entities unrelated to your instruction. 
Be careful not to mix up entities.

<INSTRUCTION>
${instruction} ${important}
</INSTRUCTION>

<FORM_FIELDS>
${JSON.stringify(formFields, null, 2)}
</FORM_FIELDS>

Your task:
1. Analyze the content provided (text or files).
2. Use the FORM_FIELDS to determine what data to extract.
3. Convert the extracted data to the format required in the FORM_FIELDS.
4. Return a json with the extracted data as values to each form field name.

Do not explain or respond to the user. Just return the json with filled fields.
Do not ask questions. Only act.
Do not fill fields with "null", "undefined", "none", "N/A", "unknown" or similar.
Only fill in the fields with the extracted data. Don't use your own knowledge or assumptions.
When in doubt, don't mention the field in your response.

Today is ${new Date().toLocaleDateString()}`;

    try {
      const { filteredArgs, tokens } = await withRetry(() =>
        generateAndParse({ ai, uploadedFiles, pastedText, systemInstructions }),
      );

      const duration = Date.now() - start;
      res.json({ status: 'ok', data: filteredArgs, duration, tokens });
    } catch (err) {
      console.dir(err, { depth: null });
      res.status(500).json({
        status: 'error',
        message: 'Gemini API request failed',
        errorCode: 'GEMINI_API_ERROR',
        error: err.message,
        shortError: 'Processing failed.',
        tip: 'Try again or check your API key.',
      });
    }
  },
);

app.post(
  '/api/evals',
  uploadMiddleware,
  express.urlencoded({ extended: true }),
  async (req, res) => {
    const { instruction = '', important = '' } = req.body;
    const file = req.files?.[0];

    let formFields, expected;
    try {
      formFields = JSON.parse(req.body.formFields || '{}');
      expected = JSON.parse(req.body.expected || '{}');
    } catch {
      return res.status(400).json({ error: 'Invalid JSON in formFields or expected' });
    }

    if (!formFields || !file) {
      return res.status(400).json({ error: 'Missing formFields or file' });
    }

    const fd = new FormData();
    fd.append('formFields', JSON.stringify(formFields));
    fd.append('instruction', instruction);
    fd.append('important', important);

    const fileBuffer = fs.readFileSync(file.path);
    fd.append('files', new Blob([fileBuffer], { type: file.mimetype }), file.originalname);

    const t0 = Date.now();
    try {
      const response = await fetch('http://localhost:3000/api/formfill', {
        method: 'POST',
        body: fd,
      });

      const data = await response.json();
      const latency = Date.now() - t0;
      const got = data?.data ?? {};

      let compareResult = null;
      let precision = null;
      let recall = null;
      let f1 = null;

      if (expected && Object.keys(expected).length) {
        compareResult = compare(expected, got);

        const { correct, wrong, missing, extra } = compareResult;

        const tp = correct;
        const fp = wrong + extra;
        const fn = missing;

        precision = tp + fp > 0 ? tp / (tp + fp) : 0;
        recall = tp + fn > 0 ? tp / (tp + fn) : 0;
        f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
      }

      res.json({
        file: file.originalname,
        ok: response.ok,
        status: response.status,
        precision,
        recall,
        f1,
        compare: compareResult,
        latency_ms: latency,
        response: data,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({
        file: file.originalname,
        ok: false,
        status: 'ERR',
        error: String(err),
      });
    } finally {
      fs.unlinkSync(file.path);
    }
  },
);

// 6. Frontend Fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// 7. Start Server
app.listen(3000, () => console.log('http://localhost:3000'));
