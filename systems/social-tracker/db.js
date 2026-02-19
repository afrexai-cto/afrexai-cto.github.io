/**
 * Database wrapper using Node.js built-in node:sqlite (v22.5+)
 * Provides a compatible API surface for the platform modules.
 */
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

class DB {
  constructor(dbPath) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec('PRAGMA journal_mode = WAL');
  }

  exec(sql) {
    this.db.exec(sql);
  }

  prepare(sql) {
    const stmt = this.db.prepare(sql);
    return {
      run(...params) { return stmt.run(...params); },
      get(...params) { return stmt.get(...params) || null; },
      all(...params) { return stmt.all(...params); },
    };
  }

  close() {
    this.db.close();
  }
}

module.exports = { DB };
