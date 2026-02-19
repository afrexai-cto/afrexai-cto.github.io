import { readFile } from 'fs/promises';

export async function getPerformance(config, targetDate) {
  try {
    const data = JSON.parse(await readFile(new URL(`../${config.path}`, import.meta.url), 'utf8'));
    return data;
  } catch {
    return null;
  }
}
