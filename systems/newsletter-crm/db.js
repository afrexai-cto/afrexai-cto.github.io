// SQLite database layer using node:sqlite (Node 22+)
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(config.database.path);
    db.exec('PRAGMA journal_mode=WAL');
    db.exec('PRAGMA foreign_keys=ON');
    // Initialize schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);
  }
  return db;
}

function upsert(table, record, keyField = 'id') {
  const d = getDb();
  const keys = Object.keys(record);
  const placeholders = keys.map(() => '?').join(', ');
  const updates = keys.filter(k => k !== keyField).map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => record[k] ?? null);
  const updateValues = keys.filter(k => k !== keyField).map(k => record[k] ?? null);

  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})
    ON CONFLICT(${keyField}) DO UPDATE SET ${updates}`;
  d.prepare(sql).run(...values, ...updateValues);
}

function query(sql, params = []) {
  return getDb().prepare(sql).all(...params);
}

function run(sql, params = []) {
  return getDb().prepare(sql).run(...params);
}

function logSync(platform, entity, count, status, errorMessage = null, startedAt) {
  run(
    `INSERT INTO sync_log (platform, entity, count, status, error_message, started_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [platform, entity, count, status, errorMessage, startedAt]
  );
}

module.exports = { getDb, upsert, query, run, logSync };
