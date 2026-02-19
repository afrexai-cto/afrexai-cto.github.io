import { readFile } from 'fs/promises';

let cache = null;

async function load(config) {
  if (!cache) cache = JSON.parse(await readFile(new URL(`../${config.path}`, import.meta.url), 'utf8'));
  return cache;
}

export async function lookupContact(config, email) {
  const data = await load(config);
  return data.contacts[email] || null;
}

export async function enrichAttendees(config, attendees) {
  const results = [];
  for (const email of attendees) {
    if (email === 'you') continue;
    const contact = await lookupContact(config, email);
    results.push(contact ? { email, ...contact } : { email, name: email, unknown: true });
  }
  return results;
}
