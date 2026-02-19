import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import config from './config.json' with { type: 'json' };

const execFileAsync = promisify(execFile);

const YOUTUBE_REGEX = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function isYouTubeURL(input) {
  return YOUTUBE_REGEX.test(input);
}

export function isDirectVideoURL(input) {
  try {
    const url = new URL(input);
    return /^https?:$/.test(url.protocol) && !isYouTubeURL(input);
  } catch {
    return false;
  }
}

export async function downloadYouTube(url) {
  const tempDir = config.tempDir;
  if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

  const outputTemplate = join(tempDir, '%(id)s.%(ext)s');

  console.log('📥 Downloading YouTube video...');

  // Try yt-dlp binary first, fall back to npx
  let ytdlp = 'yt-dlp';
  try {
    await execFileAsync('which', ['yt-dlp']);
  } catch {
    ytdlp = 'npx';
  }

  const args = ytdlp === 'npx'
    ? ['yt-dlp', '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', '-o', outputTemplate, '--no-playlist', '--print', 'after_move:filepath', url]
    : ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', '-o', outputTemplate, '--no-playlist', '--print', 'after_move:filepath', url];

  const { stdout } = await execFileAsync(ytdlp, args, { timeout: 120000 });
  const filePath = stdout.trim().split('\n').pop();

  console.log(`✅ Downloaded: ${filePath}`);
  return filePath;
}

export async function downloadDirectVideo(url) {
  const tempDir = config.tempDir;
  if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

  const urlObj = new URL(url);
  const ext = urlObj.pathname.split('.').pop()?.toLowerCase() || 'mp4';
  const filename = `direct-${Date.now()}.${ext}`;
  const filePath = join(tempDir, filename);

  console.log('📥 Downloading video from URL...');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

  const { writeFile } = await import('node:fs/promises');
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);

  console.log(`✅ Downloaded: ${filePath}`);
  return filePath;
}
