import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));

const API_KEY = process.env.GEMINI_API_KEY || config.apiKey;
const BASE_URL = config.baseUrl;
const MODEL = config.model;
const IMAGE_MODEL = config.imageModel;
const OUTPUT_DIR = resolve(__dirname, config.outputDir);

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

function outputPath(prefix = 'img', ext = 'png') {
  return join(OUTPUT_DIR, `${prefix}_${timestamp()}.${ext}`);
}

function imageToBase64(filePath) {
  const buf = readFileSync(resolve(filePath));
  return buf.toString('base64');
}

function mimeFromPath(p) {
  const ext = p.split('.').pop().toLowerCase();
  return { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' }[ext] || 'image/png';
}

/**
 * Call Gemini generateContent with image output enabled.
 * @param {Array} parts - content parts (text + optional inline_data)
 * @param {object} opts - { responseModalities, model }
 */
async function generateContent(parts, opts = {}) {
  const model = opts.model || MODEL;
  const url = `${BASE_URL}/models/${model}:generateContent?key=${API_KEY}`;

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: opts.responseModalities || ['IMAGE', 'TEXT'],
      ...(opts.generationConfig || {})
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API ${res.status}: ${err}`);
  }

  return res.json();
}

/**
 * Call Imagen 3 dedicated image generation endpoint.
 */
async function generateImage(prompt, opts = {}) {
  const model = opts.model || IMAGE_MODEL;
  const url = `${BASE_URL}/models/${model}:predict?key=${API_KEY}`;

  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: opts.count || 1,
      aspectRatio: opts.aspectRatio || '1:1',
      ...(opts.parameters || {})
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  // If Imagen endpoint fails, fall back to Gemini generateContent
  if (!res.ok) {
    console.log('Imagen endpoint unavailable, falling back to Gemini generateContent...');
    return generateContent([{ text: prompt }], opts);
  }

  return res.json();
}

/**
 * Extract and save images from a Gemini API response.
 * Returns array of saved file paths.
 */
function saveImages(response, prefix = 'img') {
  const saved = [];

  // Handle generateContent response shape
  if (response.candidates) {
    for (const candidate of response.candidates) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          const ext = part.inlineData.mimeType?.split('/')[1] || 'png';
          const outFile = outputPath(prefix, ext);
          writeFileSync(outFile, Buffer.from(part.inlineData.data, 'base64'));
          saved.push(outFile);
        }
        if (part.text) {
          console.log('Model text:', part.text);
        }
      }
    }
  }

  // Handle Imagen predict response shape
  if (response.predictions) {
    for (const pred of response.predictions) {
      if (pred.bytesBase64Encoded) {
        const outFile = outputPath(prefix, 'png');
        writeFileSync(outFile, Buffer.from(pred.bytesBase64Encoded, 'base64'));
        saved.push(outFile);
      }
    }
  }

  return saved;
}

export {
  generateContent,
  generateImage,
  saveImages,
  imageToBase64,
  mimeFromPath,
  outputPath,
  timestamp,
  API_KEY,
  OUTPUT_DIR
};
