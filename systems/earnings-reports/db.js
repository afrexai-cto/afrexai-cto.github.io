import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config.json' with { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, config.database);

let _db;

export function getDb() {
  if (!_db) {
    _db = new DatabaseSync(dbPath);
    _db.exec('PRAGMA journal_mode = WAL');
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    _db.exec(schema);
  }
  return _db;
}

// Wrapper helpers to match better-sqlite3-like API
export function prepare(sql) {
  return getDb().prepare(sql);
}
