// 1. Imports and Setup
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, createUserContent, createPartFromUri } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 2. Constants and Configs
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024); // 10MB default

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

// 5. Endpoints
app.post(
  '/api/formfill',
  uploadMiddleware,
  express.urlencoded({ extended: true }),
  async (req, res) => {
    const start = Date.now();
    const files = req.files || [];
    const formFields = JSON.parse(req.body.formFillerData || req.body.formFields || '{}');
    const instruction = req.body.instruction?.trim() || '';
    const pastedText = req.body.pastedText?.trim() || '';

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

    const systemInstructions = `You are an AI that must always call exactly one tool called "processFormFields". 
You cannot reply or assist directly. 
You must process the provided inputs using that tool and return only the correct arguments needed to call it.

You'll receive
- list of args accepted by the tool with descriptions
- optional text content pasted by the user
- optional list of uploaded files

Your task:
1. Analyze the content provided (text or files).
2. Use the tool args to determine what data to extract.
3. Return the extracted data as the args to processFormFields.
4. Comply with the format specified in the args descriptions.

Do not explain or respond to the user. Just return the tool call with filled args.
Do not ask questions. Only act.
Do not fill fields with "null", "undefined", "none", "N/A", "unknown" or similar.
All fields must be based only on the provided text or files.
When in doubt, leave the field blank.

Today is ${new Date().toLocaleDateString()}`;

    try {
      const response = await ai.models.generateContent({
        model: 'models/gemini-2.5-flash-lite',
        contents: createUserContent([
          `Please extract the relevant information from the following:\n\nPasted text:\n${
            pastedText || '[none]'
          }\n\nForm fields:\n${JSON.stringify(formFields, null, 2)}`,
          ...uploadedFiles.map((f) => createPartFromUri(f.uri, f.mimeType)),
        ]),
        config: {
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'processFormFields',
                  description: 'Fills out form fields based on input content',
                  parameters: {
                    type: 'object',
                    properties: {
                      ...formFields.properties,
                      files: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string', description: 'File name' },
                            type: { type: 'string', description: 'File MIME type' },
                            size: { type: 'integer', description: 'File size in bytes' },
                          },
                        },
                        description: 'List of uploaded files with metadata',
                      },
                    },
                    required: ['full_name', 'files'],
                  },
                },
              ],
            },
          ],
          systemInstruction: {
            role: 'system',
            parts: [{ text: systemInstructions }, instruction && { text: instruction }].filter(
              Boolean,
            ),
          },
        },
      });

      console.log(response?.candidates?.[0]?.content?.parts?.[0]?.functionCall);

      const args = response?.candidates?.[0]?.content?.parts?.[0]?.functionCall?.args;
      const durationMs = Date.now() - start;
      res.json({ status: 'ok', data: args, duration: durationMs });
    } catch (err) {
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

// 6. Frontend Fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// 7. Start Server
app.listen(3000, () => console.log('http://localhost:3000'));
