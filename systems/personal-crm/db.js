// Shared database module — uses Node.js built-in sqlite
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'crm.db');

let _db;

export function getDb() {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    _db.exec('PRAGMA journal_mode = WAL');
    _db.exec('PRAGMA foreign_keys = ON');
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    _db.exec(schema);
  }
  return _db;
}

// --- Noise filtering ---
const NOISE_PATTERNS = [
  /noreply@/i, /no-reply@/i, /donotreply@/i,
  /notifications?@/i, /alerts?@/i, /updates?@/i,
  /newsletter@/i, /marketing@/i, /promo@/i,
  /mailchimp/i, /sendgrid/i, /mailgun/i,
  /unsubscribe/i, /bulk@/i, /mailer-daemon/i,
  /@github\.com$/i, /@linkedin\.com$/i,
  /@facebookmail\.com$/i, /@youtube\.com$/i,
  /@accounts\.google\.com$/i, /@google\.com$/i,
  /@amazonses\.com$/i, /@bounce\./i,
];

export function isNoiseSender(email) {
  return NOISE_PATTERNS.some(p => p.test(email));
}

// --- Embedding helpers ---
export function float32ToBlob(arr) {
  return Buffer.from(new Float32Array(arr).buffer);
}

export function blobToFloat32(buf) {
  // node:sqlite returns ArrayBuffer or Uint8Array
  const uint8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return new Float32Array(uint8.buffer, uint8.byteOffset, uint8.byteLength / 4);
}

export function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}
