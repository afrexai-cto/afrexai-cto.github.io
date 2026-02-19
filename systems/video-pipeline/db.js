/**
 * Database wrapper around sql.js to provide a synchronous-looking API
 * compatible with the rest of the pipeline.
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let SQL = null;

async function getSqlJs() {
  if (!SQL) SQL = await initSqlJs();
  return SQL;
}

class PipelineDB {
  constructor(sqlDb, filePath) {
    this.db = sqlDb;
    this.filePath = filePath;
  }

  static async open(filePath) {
    const SQL = await getSqlJs();
    let db;
    if (filePath && fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      db = new SQL.Database(buf);
    } else {
      db = new SQL.Database();
    }
    return new PipelineDB(db, filePath);
  }

  exec(sql) {
    this.db.run(sql);
  }

  prepare(sql) {
    const db = this.db;
    return {
      run(...params) {
        db.run(sql, params);
        return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0][0] || 0 };
      },
      get(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((c, i) => { row[c] = vals[i]; });
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const results = [];
        const stmt = db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => { row[c] = vals[i]; });
          results.push(row);
        }
        stmt.free();
        return results;
      },
    };
  }

  save() {
    if (this.filePath) {
      const data = this.db.export();
      fs.writeFileSync(this.filePath, Buffer.from(data));
    }
  }

  close() {
    this.save();
    this.db.close();
  }
}

module.exports = { PipelineDB };
