import { readFile } from 'fs/promises';

export async function getThreads(config) {
  const data = JSON.parse(await readFile(new URL(`../${config.path}`, import.meta.url), 'utf8'));
  return data.threads;
}

export async function getRelatedThreads(config, eventId) {
  const threads = await getThreads(config);
  return threads.filter(t => t.relatedEvents?.includes(eventId));
}

export async function getUnreadThreads(config) {
  const threads = await getThreads(config);
  return threads.filter(t => t.unread);
}
