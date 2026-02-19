// Database initialization and helpers using sql.js (pure JS SQLite)
import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config.json' with { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, config.database.path);

let _db;
let _SQL;

export async function getDb() {
  if (!_db) {
    _SQL = await initSqlJs();
    if (existsSync(DB_PATH)) {
      const buf = readFileSync(DB_PATH);
      _db = new _SQL.Database(buf);
    } else {
      _db = new _SQL.Database();
    }
    _db.run('PRAGMA foreign_keys = ON');
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    _db.run(schema);
  }
  return _db;
}

export function saveDb() {
  if (_db) {
    const data = _db.export();
    writeFileSync(DB_PATH, Buffer.from(data));
  }
}

export function closeDb() {
  if (_db) { saveDb(); _db.close(); _db = null; }
}

// Helper to run a query and get results as objects
function allRows(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function getRow(db, sql, params = []) {
  const rows = allRows(db, sql, params);
  return rows[0] || null;
}

export async function insertClassification(data) {
  const db = await getDb();
  db.run(`INSERT OR IGNORE INTO classifications 
    (message_id, thread_id, subject, sender, sender_domain, snippet, received_at, urgency_score, urgency_label, reasoning, raw_headers)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.message_id, data.thread_id, data.subject, data.sender, data.sender_domain, 
     data.snippet, data.received_at, data.urgency_score, data.urgency_label, data.reasoning, data.raw_headers]);
  saveDb();
}

export async function markAlerted(messageId) {
  const db = await getDb();
  db.run('UPDATE classifications SET alerted = 1 WHERE message_id = ?', [messageId]);
  saveDb();
}

export async function getUnalerted(minLabel = 'high') {
  const db = await getDb();
  const labels = ['critical', 'high', 'medium', 'low'];
  const idx = labels.indexOf(minLabel);
  const eligible = labels.slice(0, idx + 1);
  const placeholders = eligible.map(() => '?').join(',');
  return allRows(db, `SELECT * FROM classifications WHERE alerted = 0 AND urgency_label IN (${placeholders})`, eligible);
}

export async function isAlreadyClassified(messageId) {
  const db = await getDb();
  return !!getRow(db, 'SELECT 1 FROM classifications WHERE message_id = ?', [messageId]);
}

export async function updateSenderReputation(sender, domain, urgencyScore, isNoise = false) {
  const db = await getDb();
  const existing = getRow(db, 'SELECT * FROM sender_reputation WHERE sender = ?', [sender]);
  if (existing) {
    const total = existing.total_emails + 1;
    const urgentCount = existing.urgent_count + (urgencyScore >= 0.7 ? 1 : 0);
    const noiseCount = existing.noise_count + (isNoise ? 1 : 0);
    const avg = ((existing.avg_urgency * existing.total_emails) + urgencyScore) / total;
    db.run(`UPDATE sender_reputation SET total_emails=?, urgent_count=?, noise_count=?, avg_urgency=?, updated_at=datetime('now') WHERE sender=?`,
      [total, urgentCount, noiseCount, avg, sender]);
  } else {
    db.run(`INSERT INTO sender_reputation (sender, domain, total_emails, urgent_count, noise_count, avg_urgency, is_noise) VALUES (?,?,1,?,?,?,?)`,
      [sender, domain, urgencyScore >= 0.7 ? 1 : 0, isNoise ? 1 : 0, urgencyScore, isNoise ? 1 : 0]);
  }
  saveDb();
}

export async function getSenderReputation(sender) {
  const db = await getDb();
  return getRow(db, 'SELECT * FROM sender_reputation WHERE sender = ?', [sender]);
}

export async function logScan(found, classified, alerts) {
  const db = await getDb();
  db.run('INSERT INTO scan_log (emails_found, emails_classified, alerts_sent) VALUES (?,?,?)', [found, classified, alerts]);
  saveDb();
}

// For feedback module
export async function getClassificationByMessageId(messageId) {
  const db = await getDb();
  return getRow(db, 'SELECT * FROM classifications WHERE message_id = ?', [messageId]);
}

export async function insertFeedback(classificationId, correctLabel, note) {
  const db = await getDb();
  db.run('INSERT INTO feedback (classification_id, correct_label, feedback_note) VALUES (?, ?, ?)',
    [classificationId, correctLabel, note]);
  saveDb();
}

export async function getFeedbackStatsFromDb() {
  const db = await getDb();
  const total = getRow(db, 'SELECT COUNT(*) as c FROM feedback')?.c || 0;
  const corrections = allRows(db, `
    SELECT f.correct_label, c.urgency_label as original_label, COUNT(*) as count
    FROM feedback f JOIN classifications c ON f.classification_id = c.id
    WHERE f.correct_label != c.urgency_label
    GROUP BY f.correct_label, c.urgency_label`);
  const accuracy = getRow(db, `
    SELECT COUNT(*) as c FROM feedback f JOIN classifications c ON f.classification_id = c.id
    WHERE f.correct_label = c.urgency_label`)?.c || 0;
  return { total, accurate: accuracy, accuracy_pct: total ? ((accuracy / total) * 100).toFixed(1) : 'N/A', corrections };
}

export async function getReputationReportFromDb() {
  const db = await getDb();
  return allRows(db, 'SELECT * FROM sender_reputation ORDER BY avg_urgency DESC LIMIT 50');
}
