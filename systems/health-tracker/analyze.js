#!/usr/bin/env node
const { getDb } = require('./db');

const [,, command] = process.argv;
const db = getDb();

function weekly() {
  const rows = db.prepare(`
    SELECT date, type, description, severity FROM entries
    WHERE date >= date('now', '-7 days')
    ORDER BY date, timestamp
  `).all();

  if (!rows.length) { console.log('No entries in the past 7 days.'); return; }

  console.log('=== Weekly Summary ===\n');
  const byDate = {};
  for (const r of rows) { (byDate[r.date] ??= []).push(r); }
  for (const [date, entries] of Object.entries(byDate)) {
    console.log(`📅 ${date}`);
    for (const e of entries) {
      if (e.type === 'symptom') console.log(`  🩺 ${e.description} (${e.severity}/5)`);
      else if (e.type === 'food') console.log(`  🍽️  ${e.description}`);
      else if (e.type === 'drink') console.log(`  🥤 ${e.description}`);
      else console.log(`  📝 ${e.description}`);
    }
  }
  const symptoms = rows.filter(r => r.type === 'symptom');
  const foods = rows.filter(r => r.type === 'food');
  const drinks = rows.filter(r => r.type === 'drink');
  console.log(`\n📊 Totals: ${foods.length} foods, ${drinks.length} drinks, ${symptoms.length} symptoms`);
  if (symptoms.length) {
    const avg = (symptoms.reduce((s, r) => s + r.severity, 0) / symptoms.length).toFixed(1);
    console.log(`   Avg symptom severity: ${avg}/5`);
  }
}

function correlations() {
  const corr = db.prepare(`
    SELECT f.description AS trigger_item, f.type AS trigger_type, s.description AS symptom, s.severity
    FROM entries f JOIN entries s ON s.type = 'symptom' AND s.date = f.date
    WHERE f.type IN ('food', 'drink')
    ORDER BY s.severity DESC
  `).all();

  if (!corr.length) { console.log('No correlations found.'); return; }

  console.log('=== Food/Drink ↔ Symptom Correlations ===\n');
  const map = {};
  for (const c of corr) {
    const key = `${c.trigger_item}|${c.symptom}`;
    if (!map[key]) map[key] = { ...c, count: 0, totalSev: 0 };
    map[key].count++;
    map[key].totalSev += c.severity;
  }
  const unique = Object.values(map).sort((a, b) => (b.totalSev / b.count) - (a.totalSev / a.count));
  for (const c of unique) {
    const avg = (c.totalSev / c.count).toFixed(1);
    const icon = c.trigger_type === 'food' ? '🍽️' : '🥤';
    const bar = '█'.repeat(Math.round(c.totalSev / c.count));
    console.log(`  ${icon} ${c.trigger_item} → 🩺 ${c.symptom}  [${bar}] avg:${avg}/5 (${c.count}x)`);
  }
  const triggers = unique.filter(c => (c.totalSev / c.count) >= 3);
  if (triggers.length) {
    console.log('\n⚠️  Potential Triggers (avg severity ≥ 3):');
    for (const t of triggers) {
      console.log(`   ${t.trigger_item} → ${t.symptom} (avg ${(t.totalSev / t.count).toFixed(1)}/5)`);
    }
  }
}

if (command === 'weekly') weekly();
else if (command === 'correlations') correlations();
else { console.error('Usage: node analyze.js <weekly|correlations>'); process.exit(1); }
db.close();
