#!/usr/bin/env node
/**
 * Video Generation CLI - Google Veo 3
 *
 * Usage:
 *   node generate.js "a drone shot flying over mountains at sunset"
 *   node generate.js --image input.png "animate this scene"
 *   node generate.js --fast --aspect 9:16 "vertical video of a cat"
 *   node generate.js --duration 4 --count 2 "ocean waves"
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { VeoClient } from './veo-client.js';

const require = createRequire(import.meta.url);
const config = require('./config.json');

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    image:    { type: 'string',  short: 'i' },
    fast:     { type: 'boolean', short: 'f', default: false },
    aspect:   { type: 'string',  short: 'a' },
    duration: { type: 'string',  short: 'd' },
    count:    { type: 'string',  short: 'c' },
    resolution: { type: 'string', short: 'r' },
    negative: { type: 'string',  short: 'n' },
    seed:     { type: 'string',  short: 's' },
    mock:     { type: 'boolean', default: false },
    help:     { type: 'boolean', short: 'h', default: false },
  },
});

if (flags.help || positionals.length === 0) {
  console.log(`
Video Generation CLI (Google Veo 3)

Usage:
  node generate.js [options] "<prompt>"

Options:
  -i, --image <path>       Input image for image-to-video
  -f, --fast               Use fast model (veo-3.0-fast-generate-001)
  -a, --aspect <ratio>     Aspect ratio: 16:9 (default) or 9:16
  -d, --duration <sec>     Duration: 4, 6, or 8 (default: 8)
  -c, --count <n>          Number of videos: 1-4 (default: 1)
  -r, --resolution <res>   Resolution: 720p or 1080p (default: 720p)
  -n, --negative <text>    Negative prompt
  -s, --seed <number>      Seed for reproducibility
      --mock               Use mock responses (for testing)
  -h, --help               Show this help
`);
  process.exit(flags.help ? 0 : 1);
}

const prompt = positionals.join(' ');

const options = {
  fast: flags.fast,
  ...(flags.aspect && { aspectRatio: flags.aspect }),
  ...(flags.duration && { durationSeconds: parseInt(flags.duration) }),
  ...(flags.count && { sampleCount: parseInt(flags.count) }),
  ...(flags.resolution && { resolution: flags.resolution }),
  ...(flags.negative && { negativePrompt: flags.negative }),
  ...(flags.seed != null && { seed: parseInt(flags.seed) }),
};

const modelName = flags.fast ? (config.fastModel || 'veo-3.0-fast-generate-001') : (config.model || 'veo-3.0-generate-001');
console.log(`🎬 Prompt: "${prompt}"`);
if (flags.image) console.log(`🖼️  Image: ${flags.image}`);
console.log(`⚙️  Model: ${modelName}`);

if (flags.mock) {
  // Mock mode for testing — skip API call, write a fake video
  console.log('🧪 Mock mode enabled');
  const outputDir = resolve(config.outputDir || './output');
  await mkdir(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `veo3-${timestamp}.mp4`;
  const outPath = join(outputDir, filename);
  const mockData = Buffer.from('MOCK_VIDEO_DATA_' + Date.now());
  await writeFile(outPath, mockData);

  console.log(`✅ Saved: ${outPath} (${(mockData.length / 1024).toFixed(1)} KB)`);
  console.log(`\n🎉 Generated 1 video(s)`);
} else {
  const client = new VeoClient();
  const results = flags.image
    ? await client.generateFromImage(flags.image, prompt, options)
    : await client.generateFromText(prompt, options);

  console.log(`\n🎉 Generated ${results.length} video(s)`);
}
