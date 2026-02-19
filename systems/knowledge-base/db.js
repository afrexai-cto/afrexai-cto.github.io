// Database helper - shared SQLite connection via sql.js (pure JS, no native deps)
import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'knowledge.db');

let _db;
let _SQL;

export async function getDb() {
  if (_db) return _db;
  if (!_SQL) _SQL = await initSqlJs();
  
  if (existsSync(DB_PATH)) {
    const buf = readFileSync(DB_PATH);
    _db = new _SQL.Database(buf);
  } else {
    _db = new _SQL.Database();
  }
  
  // Run schema
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  _db.run(schema);
  _db.run('PRAGMA foreign_keys = ON');
  return _db;
}

export function saveDb() {
  if (_db) {
    const data = _db.export();
    writeFileSync(DB_PATH, Buffer.from(data));
  }
}

export function closeDb() {
  if (_db) {
    saveDb();
    _db.close();
    _db = null;
  }
}

// Helper: run a statement and return lastInsertRowid
export function runStmt(db, sql, params = []) {
  db.run(sql, params);
  const r = db.exec('SELECT last_insert_rowid() as id');
  return r.length ? r[0].values[0][0] : 0;
}

// Helper: get all rows as objects
export function allRows(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// Helper: get one row as object
export function getRow(db, sql, params = []) {
  const rows = allRows(db, sql, params);
  return rows.length ? rows[0] : null;
}
