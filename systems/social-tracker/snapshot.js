#!/usr/bin/env node
/**
 * Social Media Snapshot CLI
 * Usage: node snapshot.js [youtube|instagram|twitter|tiktok|all]
 */

const { DB } = require('./db');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const youtube = require('./platforms/youtube');
const instagram = require('./platforms/instagram');
const twitter = require('./platforms/twitter');
const tiktok = require('./platforms/tiktok');

const PLATFORMS = { youtube, instagram, twitter, tiktok };

function initDB() {
  const dbPath = path.resolve(__dirname, config.database.path);
  const db = new DB(dbPath);
  const schema = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf-8');
  // Execute each statement separately (node:sqlite doesn't support multi-statement exec well)
  for (const stmt of schema.split(';').map(s => s.trim()).filter(Boolean)) {
    db.exec(stmt + ';');
  }
  return db;
}

async function runSnapshot(platformName) {
  const db = initDB();
  const date = new Date().toISOString().split('T')[0];

  const targets = platformName === 'all' ? Object.keys(PLATFORMS) : [platformName];

  for (const name of targets) {
    if (!PLATFORMS[name]) {
      console.error(`Unknown platform: ${name}`);
      process.exit(1);
    }
    console.log(`\n📸 Snapshotting ${name}...`);
    try {
      const result = await PLATFORMS[name].snapshot(db, date);
      console.log(`  ✅ ${name} done:`, JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(`  ❌ ${name} failed:`, err.message);
    }
  }

  db.close();
  console.log('\n✅ Snapshot complete.');
}

const platform = process.argv[2] || 'all';
runSnapshot(platform).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
