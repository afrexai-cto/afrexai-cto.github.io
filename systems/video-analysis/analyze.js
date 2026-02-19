#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { GeminiVideoClient } from './gemini-video-client.js';
import { isYouTubeURL, isDirectVideoURL, downloadYouTube, downloadDirectVideo } from './youtube-downloader.js';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
🎬 Gemini Video Analysis
========================

Usage:
  node analyze.js <video-file>              Analyze a local video file
  node analyze.js <youtube-url>             Analyze a YouTube video
  node analyze.js <video-url>               Analyze a video from URL
  node analyze.js <input> --prompt "..."    Custom analysis prompt
  node analyze.js <input> --no-cleanup      Keep uploaded file in Gemini

Options:
  --prompt "..."    Custom prompt (replaces default analysis)
  --no-cleanup      Don't delete the uploaded file from Gemini after analysis
  --help, -h        Show this help

Environment:
  GEMINI_API_KEY    Required. Your Google Gemini API key.

Examples:
  node analyze.js presentation.mp4
  node analyze.js "https://youtube.com/watch?v=dQw4w9WgXcQ"
  node analyze.js clip.mp4 --prompt "List all spoken dialogue with timestamps"
`);
  process.exit(0);
}

async function main() {
  const input = args[0];
  const promptIdx = args.indexOf('--prompt');
  const customPrompt = promptIdx !== -1 ? args[promptIdx + 1] : null;
  const noCleanup = args.includes('--no-cleanup');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY environment variable is required');
    console.error('   Set it: export GEMINI_API_KEY="your-key-here"');
    process.exit(1);
  }

  const client = new GeminiVideoClient(apiKey);
  let localFile = null;
  let isTemp = false;

  try {
    // Resolve input to a local file
    if (isYouTubeURL(input)) {
      localFile = await downloadYouTube(input);
      isTemp = true;
    } else if (isDirectVideoURL(input)) {
      localFile = await downloadDirectVideo(input);
      isTemp = true;
    } else {
      localFile = resolve(input);
      if (!existsSync(localFile)) {
        console.error(`❌ File not found: ${localFile}`);
        process.exit(1);
      }
    }

    // Upload and analyze
    const file = await client.uploadVideo(localFile);
    const result = await client.analyze(file, customPrompt);

    console.log('\n' + '='.repeat(60));
    console.log('📊 ANALYSIS RESULTS');
    console.log('='.repeat(60) + '\n');
    console.log(result);

    if (!noCleanup) await client.cleanup(file);

    // Clean up temp downloaded files
    if (isTemp && localFile) {
      const { unlink } = await import('node:fs/promises');
      await unlink(localFile).catch(() => {});
    }

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
