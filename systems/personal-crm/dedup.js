#!/usr/bin/env node
// Duplicate contact detection with merge suggestions
// Detects: similar names, email domain matches, typos

import { getDb } from './db.js';

function findDuplicates() {
  const db = getDb();

  const contacts = db.prepare(`
    SELECT id, email, name, company FROM contacts
    WHERE is_noise = 0 AND merged_into IS NULL
    ORDER BY name
  `).all();

  const dupes = [];

  for (let i = 0; i < contacts.length; i++) {
    for (let j = i + 1; j < contacts.length; j++) {
      const a = contacts[i];
      const b = contacts[j];
      const reasons = [];

      // Same name different email
      if (a.name && b.name && normalize(a.name) === normalize(b.name)) {
        reasons.push('same name');
      }

      // Similar email (same local part, different domain)
      const aLocal = a.email.split('@')[0];
      const bLocal = b.email.split('@')[0];
      if (aLocal === bLocal && a.email !== b.email) {
        reasons.push('same email prefix');
      }

      // Same domain + similar name
      const aDomain = a.email.split('@')[1];
      const bDomain = b.email.split('@')[1];
      if (aDomain === bDomain && a.name && b.name && levenshtein(normalize(a.name), normalize(b.name)) <= 2) {
        reasons.push('same domain + similar name');
      }

      if (reasons.length > 0) {
        dupes.push({ a, b, reasons });
      }
    }
  }

  if (dupes.length === 0) {
    console.log('\n✅ No duplicate contacts detected.');
    return;
  }

  console.log(`\n🔍 Found ${dupes.length} potential duplicate pairs:\n`);
  for (let i = 0; i < dupes.length; i++) {
    const { a, b, reasons } = dupes[i];
    console.log(`  ${i + 1}. ${a.name || '?'} <${a.email}> (id:${a.id})`);
    console.log(`     ${b.name || '?'} <${b.email}> (id:${b.id})`);
    console.log(`     Reason: ${reasons.join(', ')}`);
    console.log();
  }

  console.log(`To merge: node dedup.js merge <keep_id> <remove_id>`);
}

// --- Merge command ---
function merge(keepId, removeId) {
  const db = getDb();

  const keep = db.prepare('SELECT * FROM contacts WHERE id = ?').get(keepId);
  const remove = db.prepare('SELECT * FROM contacts WHERE id = ?').get(removeId);
  if (!keep || !remove) {
    console.error('Contact not found');
    process.exit(1);
  }

  // Move interactions
  db.prepare('UPDATE interactions SET contact_id = ? WHERE contact_id = ?').run(keepId, removeId);
  // Move reminders
  db.prepare('UPDATE reminders SET contact_id = ? WHERE contact_id = ?').run(keepId, removeId);
  // Mark as merged
  db.prepare('UPDATE contacts SET merged_into = ? WHERE id = ?').run(keepId, removeId);
  // Fill in missing fields on keep
  for (const field of ['name', 'company', 'role', 'how_known']) {
    if (!keep[field] && remove[field]) {
      db.prepare(`UPDATE contacts SET ${field} = ? WHERE id = ?`).run(remove[field], keepId);
    }
  }

  console.log(`✅ Merged contact ${removeId} (${remove.email}) into ${keepId} (${keep.email})`);
}

// --- Helpers ---
function normalize(s) {
  return s.toLowerCase().replace(/[^a-z]/g, '');
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => {
    const row = new Array(n + 1);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// --- CLI ---
const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'merge') {
  merge(parseInt(args[0]), parseInt(args[1]));
} else {
  findDuplicates();
}
