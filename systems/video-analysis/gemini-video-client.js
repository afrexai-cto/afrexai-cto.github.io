import { GoogleGenAI, createUserContent, createPartFromUri } from '@google/genai';
import { stat } from 'node:fs/promises';
import { extname } from 'node:path';
import config from './config.json' with { type: 'json' };

export class GeminiVideoClient {
  constructor(apiKey) {
    if (!apiKey) throw new Error('GEMINI_API_KEY is required');
    this.ai = new GoogleGenAI({ apiKey });
    this.model = config.model;
  }

  getMimeType(filePath) {
    const ext = extname(filePath).slice(1).toLowerCase();
    return config.mimeTypes[ext] || 'video/mp4';
  }

  async uploadVideo(filePath) {
    const fileInfo = await stat(filePath);
    const sizeMB = fileInfo.size / (1024 * 1024);

    if (sizeMB > config.maxFileSizeMB) {
      throw new Error(`File too large: ${sizeMB.toFixed(1)}MB (max ${config.maxFileSizeMB}MB)`);
    }

    const mimeType = this.getMimeType(filePath);
    console.log(`📤 Uploading ${(sizeMB).toFixed(1)}MB video (${mimeType})...`);

    const uploadedFile = await this.ai.files.upload({
      file: filePath,
      config: { mimeType },
    });

    console.log(`⏳ Processing: ${uploadedFile.name}`);

    // Poll until file is ACTIVE
    let file = uploadedFile;
    const deadline = Date.now() + config.pollTimeoutMs;

    while (file.state === 'PROCESSING') {
      if (Date.now() > deadline) throw new Error('File processing timed out');
      await new Promise(r => setTimeout(r, config.pollIntervalMs));
      file = await this.ai.files.get({ name: file.name });
      process.stdout.write('.');
    }
    console.log('');

    if (file.state === 'FAILED') {
      throw new Error(`File processing failed: ${file.error?.message || 'unknown error'}`);
    }

    console.log('✅ Video ready for analysis');
    return file;
  }

  async analyze(file, customPrompt) {
    const prompt = customPrompt || config.prompt.analysis;

    console.log(`🧠 Analyzing with ${this.model}...`);

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: createUserContent([
        createPartFromUri(file.uri, file.mimeType),
        prompt,
      ]),
    });

    return response.text;
  }

  async cleanup(file) {
    try {
      await this.ai.files.delete({ name: file.name });
      console.log('🗑️  Cleaned up uploaded file');
    } catch {
      // Ignore cleanup errors
    }
  }
}
