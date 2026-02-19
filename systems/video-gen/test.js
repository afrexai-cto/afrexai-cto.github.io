import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir, stat, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const exec = promisify(execFile);
const DIR = resolve(import.meta.dirname);

describe('Video Gen CLI', () => {
  it('shows help with --help', async () => {
    const { stdout } = await exec('node', ['generate.js', '--help'], { cwd: DIR });
    assert.match(stdout, /Usage/);
    assert.match(stdout, /--image/);
    assert.match(stdout, /--fast/);
  });

  it('exits with error when no prompt given', async () => {
    await assert.rejects(
      exec('node', ['generate.js'], { cwd: DIR }),
      (err) => err.code === 1
    );
  });

  it('generates mock video from text prompt', async () => {
    const { stdout } = await exec(
      'node',
      ['generate.js', '--mock', 'a drone shot over mountains'],
      { cwd: DIR }
    );
    assert.match(stdout, /Mock mode enabled/);
    assert.match(stdout, /Saved/);
    assert.match(stdout, /veo3-.*\.mp4/);
    assert.match(stdout, /Generated 1 video/);
  });

  it('generates mock video with --image flag', async () => {
    // Create a tiny test image
    const { writeFile } = await import('node:fs/promises');
    const testImg = resolve(DIR, 'test-input.png');
    await writeFile(testImg, Buffer.from('PNG_TEST'));

    const { stdout } = await exec(
      'node',
      ['generate.js', '--mock', '--image', 'test-input.png', 'animate this'],
      { cwd: DIR }
    );
    assert.match(stdout, /Image:/);
    assert.match(stdout, /Generated 1 video/);

    await rm(testImg);
  });

  it('respects --fast flag in output', async () => {
    const { stdout } = await exec(
      'node',
      ['generate.js', '--mock', '--fast', 'test prompt'],
      { cwd: DIR }
    );
    assert.match(stdout, /fast-generate/);
  });

  it('saves files with timestamped names in output/', async () => {
    const before = new Date();
    await exec('node', ['generate.js', '--mock', 'timestamp test'], { cwd: DIR });
    const files = await readdir(resolve(DIR, 'output'));
    const mp4s = files.filter((f) => f.endsWith('.mp4'));
    assert.ok(mp4s.length > 0, 'Should have at least one mp4');
    // Check filename format: veo3-YYYY-MM-DDTHH-MM-SS.mp4
    assert.match(mp4s[mp4s.length - 1], /^veo3-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}.*\.mp4$/);
  });
});
