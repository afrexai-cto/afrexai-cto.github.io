#!/usr/bin/env node
const { getDb, appendMarkdown } = require('./db');

const [,, type, description, severityArg] = process.argv;
const VALID = ['food', 'drink', 'symptom', 'note'];

if (!type || !description || !VALID.includes(type)) {
  console.error(`Usage: node log.js <${VALID.join('|')}> "description" [severity 1-5]`);
  process.exit(1);
}

const severity = type === 'symptom' ? parseInt(severityArg) || 3 : null;
if (type === 'symptom' && (severity < 1 || severity > 5)) {
  console.error('Severity must be 1-5');
  process.exit(1);
}

const db = getDb();
const now = new Date();
const timestamp = now.toISOString().replace('T', ' ').slice(0, 19);
const date = timestamp.slice(0, 10);

const stmt = db.prepare('INSERT INTO entries (type, description, severity, timestamp, date) VALUES (?, ?, ?, ?, ?)');
const result = stmt.run(type, description, severity, timestamp, date);

appendMarkdown({ type, description, severity, timestamp, date });
console.log(`✅ Logged ${type}: "${description}"${severity ? ` (severity ${severity}/5)` : ''} [id:${result.lastInsertRowid}]`);
db.close();
