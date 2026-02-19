/**
 * veo-client.js — Veo 3 video generation client via Google GenAI SDK (Vertex AI)
 *
 * Uses the official @google/genai SDK which supports:
 *   - Vertex AI mode (set GOOGLE_GENAI_USE_VERTEXAI=True)
 *   - AI Studio mode (set GOOGLE_API_KEY)
 *
 * REST equivalent (for reference):
 *   POST https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/publishers/google/models/{model}:predictLongRunning
 *   Poll: POST .../{model}:fetchPredictOperation
 */

import { GoogleGenAI } from '@google/genai';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join, extname, basename } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./config.json');

export class VeoClient {
  constructor(opts = {}) {
    this.projectId = opts.projectId || config.projectId || process.env.GOOGLE_CLOUD_PROJECT;
    this.location = opts.location || config.location || process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    this.model = opts.model || config.model || 'veo-3.0-generate-001';
    this.fastModel = opts.fastModel || config.fastModel || 'veo-3.0-fast-generate-001';
    this.outputDir = opts.outputDir || config.outputDir || './output';
    this.pollIntervalMs = config.polling?.intervalMs || config.pollIntervalMs || 5000;
    this.maxPollAttempts = config.polling?.maxAttempts || config.maxPollAttempts || 120;

    // Determine auth mode: Vertex AI (ADC) or API key
    const useVertex = process.env.GOOGLE_GENAI_USE_VERTEXAI === 'True' || !process.env.GOOGLE_API_KEY;

    if (useVertex) {
      this.client = new GoogleGenAI({
        vertexai: true,
        project: this.projectId,
        location: this.location,
      });
    } else {
      this.client = new GoogleGenAI({
        apiKey: process.env.GOOGLE_API_KEY,
      });
    }

    // Ensure output dir exists
    mkdirSync(this.outputDir, { recursive: true });
  }

  /**
   * Generate video from a text prompt.
   */
  async generateFromText(prompt, opts = {}) {
    const params = this._buildParams(opts);
    const modelId = opts.fast ? this.fastModel : this.model;
    console.log(`[veo] Generating video from text prompt: "${prompt.slice(0, 80)}..."`);
    console.log(`[veo] Model: ${modelId} | Duration: ${params.duration}s | Aspect: ${params.aspectRatio}`);

    let operation = await this.client.models.generateVideos({
      model: modelId,
      prompt,
      config: {
        aspectRatio: params.aspectRatio,
        duration: params.duration,
        numberOfVideos: params.sampleCount,
        resolution: params.resolution,
        personGeneration: params.personGeneration,
        ...(params.negativePrompt ? { negativePrompt: params.negativePrompt } : {}),
        ...(params.seed != null ? { seed: params.seed } : {}),
      },
    });

    return this._waitAndSave(operation, prompt);
  }

  /**
   * Generate video from an image + text prompt (image-to-video).
   */
  async generateFromImage(imagePath, prompt, opts = {}) {
    const params = this._buildParams(opts);
    const modelId = opts.fast ? this.fastModel : this.model;
    const absPath = resolve(imagePath);

    if (!existsSync(absPath)) {
      throw new Error(`Image not found: ${absPath}`);
    }

    const imageBytes = readFileSync(absPath);
    const mimeType = this._inferMime(absPath);
    const imageBase64 = imageBytes.toString('base64');

    console.log(`[veo] Generating video from image: ${basename(absPath)} + prompt: "${prompt.slice(0, 60)}..."`);
    console.log(`[veo] Model: ${modelId} | Duration: ${params.duration}s | Aspect: ${params.aspectRatio}`);

    let operation = await this.client.models.generateVideos({
      model: modelId,
      prompt,
      image: {
        imageBytes: imageBase64,
        mimeType,
      },
      config: {
        aspectRatio: params.aspectRatio,
        duration: params.duration,
        numberOfVideos: params.sampleCount,
        resolution: params.resolution,
        personGeneration: params.personGeneration,
        ...(params.negativePrompt ? { negativePrompt: params.negativePrompt } : {}),
        ...(params.seed != null ? { seed: params.seed } : {}),
      },
    });

    return this._waitAndSave(operation, prompt);
  }

  /**
   * Poll the long-running operation until done, then save video(s) locally.
   */
  async _waitAndSave(operation, prompt) {
    let attempts = 0;

    while (!operation.done && attempts < this.maxPollAttempts) {
      attempts++;
      console.log(`[veo] Polling... attempt ${attempts}/${this.maxPollAttempts}`);
      await this._sleep(this.pollIntervalMs);

      operation = await this.client.operations.get({
        operation: operation.name,
      });
    }

    if (!operation.done) {
      throw new Error(`[veo] Operation timed out after ${this.maxPollAttempts} attempts`);
    }

    if (operation.error) {
      throw new Error(`[veo] Generation failed: ${JSON.stringify(operation.error)}`);
    }

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const slugPrompt = prompt.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 40);
    const results = [];

    const videos = operation.response?.videos || operation.response?.generatedVideos || [];

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const filename = `veo3-${timestamp}_${slugPrompt}_${i}.mp4`;
      const outPath = join(this.outputDir, filename);

      if (video.video?.uri) {
        console.log(`[veo] Video ${i} available at: ${video.video.uri}`);
        results.push({ gcsUri: video.video.uri, localPath: null, filename });
      } else if (video.video?.videoBytes || video.videoBytes) {
        const bytes = Buffer.from(video.video?.videoBytes || video.videoBytes, 'base64');
        writeFileSync(outPath, bytes);
        console.log(`[veo] Saved video ${i}: ${outPath} (${(bytes.length / 1024 / 1024).toFixed(1)} MB)`);
        results.push({ gcsUri: null, localPath: outPath, filename });
      } else if (video.gcsUri) {
        console.log(`[veo] Video ${i} at GCS: ${video.gcsUri}`);
        results.push({ gcsUri: video.gcsUri, localPath: null, filename });
      }
    }

    if (results.length === 0) {
      console.warn('[veo] No videos in response. Full response:', JSON.stringify(operation.response, null, 2));
    }

    return results;
  }

  _buildParams(opts) {
    const d = config.defaults || {};
    return {
      aspectRatio: opts.aspectRatio || d.aspectRatio || '16:9',
      duration: opts.duration || opts.durationSeconds || d.durationSeconds || d.duration || 8,
      sampleCount: opts.sampleCount || d.sampleCount || 1,
      resolution: opts.resolution || d.resolution || '720p',
      personGeneration: opts.personGeneration || d.personGeneration || 'allow_adult',
      negativePrompt: opts.negativePrompt || null,
      seed: opts.seed ?? null,
    };
  }

  _inferMime(filePath) {
    const ext = extname(filePath).toLowerCase();
    const map = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };
    return map[ext] || 'image/png';
  }

  _sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
