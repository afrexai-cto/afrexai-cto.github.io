const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'health.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const DATA_DIR = path.join(__dirname, 'data');

function getDb() {
  const db = new DatabaseSync(DB_PATH);
  db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  return db;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function appendMarkdown(entry) {
  ensureDataDir();
  const file = path.join(DATA_DIR, `${entry.date}.md`);
  const time = entry.timestamp.split(' ')[1] || '';
  let line = '';
  if (entry.type === 'symptom') {
    line = `- **${time}** 🩺 ${entry.description} (severity: ${entry.severity}/5)\n`;
  } else if (entry.type === 'food') {
    line = `- **${time}** 🍽️ ${entry.description}\n`;
  } else if (entry.type === 'drink') {
    line = `- **${time}** 🥤 ${entry.description}\n`;
  } else {
    line = `- **${time}** 📝 ${entry.description}\n`;
  }
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `# Health Journal — ${entry.date}\n\n`);
  }
  fs.appendFileSync(file, line);
}

module.exports = { getDb, appendMarkdown, DATA_DIR };
