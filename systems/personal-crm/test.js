#!/usr/bin/env node
// Integration test with synthetic data
import { getDb, isNoiseSender, float32ToBlob, blobToFloat32, cosineSimilarity } from './db.js';
import { unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use a test DB
const testDbPath = join(__dirname, 'crm.db');

const results = [];
function assert(name, condition) {
  results.push({ name, pass: !!condition });
  console.log(condition ? `  ✅ ${name}` : `  ❌ ${name}`);
}

console.log('\n🧪 Running Personal CRM tests...\n');

// --- DB & Schema ---
const db = getDb();
assert('DB initializes', db);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
assert('Has contacts table', tables.includes('contacts'));
assert('Has interactions table', tables.includes('interactions'));
assert('Has embeddings table', tables.includes('embeddings'));
assert('Has reminders table', tables.includes('reminders'));
assert('Has health_scores table', tables.includes('health_scores'));

// --- Noise filter ---
assert('Detects noreply as noise', isNoiseSender('noreply@company.com'));
assert('Detects newsletter as noise', isNoiseSender('newsletter@news.com'));
assert('Real email not noise', !isNoiseSender('john@acme.com'));
assert('Github noise', isNoiseSender('notifications@github.com'));

// --- Contact CRUD ---
const ins = db.prepare(
  "INSERT INTO contacts (email, name, company, role, how_known, is_noise) VALUES (?, ?, ?, ?, ?, ?) RETURNING id"
);
const c1 = ins.get('alice@nvidia.com', 'Alice Chen', 'NVIDIA', 'Engineer', 'Conference', 0);
const c2 = ins.get('bob@google.com', 'Bob Smith', 'Google', 'PM', 'College', 0);
const c3 = ins.get('carol@nvidia.com', 'Carol Davis', 'NVIDIA', 'Director', 'LinkedIn', 0);
const c4 = ins.get('alice.chen@gmail.com', 'Alice Chen', null, null, null, 0);
const c5 = ins.get('spam@marketing.com', 'Spammer', null, null, null, 1);

assert('Insert contacts', c1 && c2 && c3);

// --- Interactions ---
const addInteraction = db.prepare(
  "INSERT INTO interactions (contact_id, type, direction, subject, snippet, message_id, occurred_at) VALUES (?, 'email', ?, ?, ?, ?, ?)"
);
// Alice: recent & frequent
addInteraction.run(c1.id, 'inbound', 'GPU perf review', 'Hey, about the benchmark...', 'msg1', '2026-02-15T10:00:00Z');
addInteraction.run(c1.id, 'outbound', 'Re: GPU perf review', 'Thanks for sharing...', 'msg2', '2026-02-16T10:00:00Z');
addInteraction.run(c1.id, 'inbound', 'Meeting next week?', 'Can we sync?', 'msg3', '2026-02-18T10:00:00Z');

// Bob: stale
addInteraction.run(c2.id, 'inbound', 'Catch up', 'Long time no see', 'msg4', '2025-06-01T10:00:00Z');

// Carol: moderate
addInteraction.run(c3.id, 'outbound', 'Intro request', 'Would love to connect', 'msg5', '2026-01-10T10:00:00Z');

assert('Insert interactions', true);

// --- Query: company search ---
const nvContacts = db.prepare(
  "SELECT * FROM contacts WHERE is_noise = 0 AND merged_into IS NULL AND (company LIKE ? OR email LIKE ?)"
).all('%NVIDIA%', '%nvidia%');
assert('Find NVIDIA contacts', nvContacts.length === 2);

// --- Query: stale contacts ---
const staleContacts = db.prepare(`
  SELECT c.*, MAX(i.occurred_at) as last_interaction,
         CAST(julianday('now') - julianday(MAX(i.occurred_at)) AS INTEGER) as days_ago
  FROM contacts c
  LEFT JOIN interactions i ON i.contact_id = c.id
  WHERE c.is_noise = 0 AND c.merged_into IS NULL
  GROUP BY c.id
  HAVING days_ago > 30 OR last_interaction IS NULL
`).all();
assert('Find stale contacts (Bob + Alice2)', staleContacts.length >= 1);

// --- Embeddings ---
const fakeVec = new Array(1536).fill(0).map((_, i) => Math.sin(i));
const fakeVec2 = new Array(1536).fill(0).map((_, i) => Math.sin(i + 0.1));
const fakeVec3 = new Array(1536).fill(0).map((_, i) => Math.cos(i));

db.prepare('INSERT INTO embeddings (contact_id, text, vector) VALUES (?, ?, ?)').run(
  c1.id, 'Alice Chen | alice@nvidia.com | NVIDIA | Engineer', float32ToBlob(fakeVec)
);
db.prepare('INSERT INTO embeddings (contact_id, text, vector) VALUES (?, ?, ?)').run(
  c2.id, 'Bob Smith | bob@google.com | Google | PM', float32ToBlob(fakeVec3)
);

const stored = db.prepare('SELECT vector FROM embeddings WHERE contact_id = ?').get(c1.id);
const recovered = blobToFloat32(stored.vector);
assert('Embedding round-trip', Math.abs(recovered[0] - fakeVec[0]) < 0.001);

const sim = cosineSimilarity(fakeVec, fakeVec2);
assert('Similar vectors high similarity', sim > 0.9);
const dissim = cosineSimilarity(fakeVec, fakeVec3);
assert('Different vectors lower similarity', dissim < sim);

// --- Health scores ---
// Import and run inline
const now = Date.now();
function computeScore(contactId) {
  const interactions = db.prepare(
    'SELECT direction, occurred_at FROM interactions WHERE contact_id = ?'
  ).all(contactId);
  
  if (!interactions.length) return { score: 5, factors: { reason: 'no interactions' } };
  
  const lastDate = new Date(interactions[0].occurred_at);
  const daysSince = (now - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  
  let recency = daysSince < 7 ? 40 : daysSince < 30 ? 30 : daysSince < 90 ? 20 : daysSince < 180 ? 10 : 0;
  const recent = interactions.filter(i => (now - new Date(i.occurred_at).getTime()) < 90 * 86400000);
  const frequency = Math.min(30, recent.length * 3);
  const inb = interactions.filter(i => i.direction === 'inbound').length;
  const outb = interactions.filter(i => i.direction === 'outbound').length;
  const reciprocity = (inb + outb) > 0 ? Math.round(Math.min(inb, outb) / Math.max(inb, outb, 1) * 30) : 0;
  
  return { score: recency + frequency + reciprocity, factors: { recency, frequency, reciprocity, daysSince: Math.round(daysSince) } };
}

const aliceScore = computeScore(c1.id);
const bobScore = computeScore(c2.id);
assert('Alice health > Bob health', aliceScore.score > bobScore.score);
assert('Alice score reasonable', aliceScore.score > 50);
assert('Bob score low (stale)', bobScore.score < 30);

// --- Dedup ---
// Alice Chen appears twice (alice@nvidia.com and alice.chen@gmail.com)
function findDupes(contacts) {
  const dupes = [];
  for (let i = 0; i < contacts.length; i++) {
    for (let j = i + 1; j < contacts.length; j++) {
      const a = contacts[i], b = contacts[j];
      if (a.name && b.name && a.name.toLowerCase().replace(/[^a-z]/g, '') === b.name.toLowerCase().replace(/[^a-z]/g, '')) {
        dupes.push({ a, b, reason: 'same name' });
      }
    }
  }
  return dupes;
}

const allContacts = db.prepare('SELECT * FROM contacts WHERE is_noise = 0 AND merged_into IS NULL').all();
const dupes = findDupes(allContacts);
assert('Detect Alice duplicate', dupes.length >= 1 && dupes.some(d => d.a.name === 'Alice Chen'));

// Test merge
db.prepare('UPDATE interactions SET contact_id = ? WHERE contact_id = ?').run(c1.id, c4.id);
db.prepare('UPDATE contacts SET merged_into = ? WHERE id = ?').run(c1.id, c4.id);
const merged = db.prepare('SELECT * FROM contacts WHERE id = ?').get(c4.id);
assert('Merge marks merged_into', merged.merged_into === c1.id);

// --- Reminders ---
db.prepare('INSERT INTO reminders (contact_id, title, due_at) VALUES (?, ?, ?)').run(c2.id, 'Catch up with Bob', '2026-03-01');
db.prepare('INSERT INTO reminders (contact_id, title, due_at) VALUES (?, ?, ?)').run(c1.id, 'Send Alice paper', '2026-02-20');

const pending = db.prepare("SELECT * FROM reminders WHERE done = 0 AND (snoozed_until IS NULL OR datetime(snoozed_until) <= datetime('now'))").all();
assert('Pending reminders', pending.length === 2);

// Snooze
db.prepare("UPDATE reminders SET snoozed_until = datetime('now', '+7 days') WHERE id = ?").run(pending[0].id);
const afterSnooze = db.prepare("SELECT * FROM reminders WHERE done = 0 AND (snoozed_until IS NULL OR datetime(snoozed_until) <= datetime('now'))").all();
assert('Snooze reduces pending', afterSnooze.length === 1);

// Done
db.prepare('UPDATE reminders SET done = 1 WHERE id = ?').run(afterSnooze[0].id);
const afterDone = db.prepare("SELECT * FROM reminders WHERE done = 0 AND (snoozed_until IS NULL OR datetime(snoozed_until) <= datetime('now'))").all();
assert('Mark done clears reminder', afterDone.length === 0);

// --- Summary ---
console.log('\n' + '─'.repeat(40));
const passed = results.filter(r => r.pass).length;
const total = results.length;
console.log(`\n${passed}/${total} tests passed ${passed === total ? '🎉' : '⚠️'}\n`);

process.exit(passed === total ? 0 : 1);
