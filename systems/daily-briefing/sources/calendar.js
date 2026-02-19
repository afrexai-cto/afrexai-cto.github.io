import { readFile } from 'fs/promises';

export async function getEvents(config, targetDate) {
  const data = JSON.parse(await readFile(new URL(`../${config.path}`, import.meta.url), 'utf8'));
  const dateStr = targetDate.toISOString().slice(0, 10);
  return data.events.filter(e => e.start.startsWith(dateStr)).sort((a, b) => a.start.localeCompare(b.start));
}
