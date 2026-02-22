#!/usr/bin/env node
'use strict';

/**
 * Simple JSON-file database. All state lives in demo/data/db.json.
 * Reads on every access (no caching issues), writes atomically.
 */

const fs = require('fs');
const path = require('path');

let DB_FILE;
let DEMO_DIR;

const DEFAULT_DB = {
  companies: {},
  taskRuns: [],       // { id, companyId, taskId, agentId, status, startedAt, completedAt, cost, tokens, deliverablePath }
  schedules: [],      // { id, companyId, taskId, cron, enabled, lastRun, nextRun }
  dataSources: {},    // { companyId: [{ id, type, name, path, config }] }
  outputConfigs: {},  // { companyId: [{ id, type, config }] }  type: email|slack|file|pdf
  metrics: {
    totalCost: 0,
    totalTokens: 0,
    totalTasks: 0,
    totalHoursSaved: 0,
    byCompany: {},
  },
};

function init(demoDir) {
  DEMO_DIR = demoDir;
  DB_FILE = path.join(demoDir, 'data', 'db.json');
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    // Migrate from activity.json if it exists
    const actFile = path.join(demoDir, 'data', 'activity.json');
    if (fs.existsSync(actFile)) {
      const act = JSON.parse(fs.readFileSync(actFile, 'utf-8'));
      const db = { ...DEFAULT_DB };
      db.companies = act.companies || {};
      write(db);
      console.log('[db] Migrated from activity.json');
    } else {
      write(DEFAULT_DB);
      console.log('[db] Created fresh database');
    }
  }
}

function read() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch {
    return { ...DEFAULT_DB };
  }
}

function write(data) {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function update(fn) {
  const data = read();
  fn(data);
  data.lastUpdated = new Date().toISOString();
  write(data);
  return data;
}

function getDemoDir() { return DEMO_DIR; }

module.exports = { init, read, write, update, getDemoDir };
