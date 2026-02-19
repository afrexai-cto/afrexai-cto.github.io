#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { getDb } from './db.js';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    model: { type: 'string', short: 'm' },
    task:  { type: 'string', short: 't' },
  }
});

const period = positionals[0];
if (!['daily', 'weekly', 'monthly', 'all'].includes(period)) {
  console.error('Usage: node report.js <daily|weekly|monthly|all> [--model <model>] [--task <task>]');
  process.exit(1);
}

const db = getDb();
const now = new Date().toISOString();

const ranges = {
  daily:   `datetime('now', '-1 day')`,
  weekly:  `datetime('now', '-7 days')`,
  monthly: `datetime('now', '-30 days')`,
  all:     `'1970-01-01'`,
};

let where = `timestamp >= ${ranges[period]}`;
const params = [];
if (values.model) { where += ` AND model = ?`; params.push(values.model); }
if (values.task)  { where += ` AND task = ?`;  params.push(values.task); }

// Summary
const summary = db.prepare(`
  SELECT COUNT(*) as calls, 
         COALESCE(SUM(input_tokens),0) as total_input,
         COALESCE(SUM(output_tokens),0) as total_output,
         COALESCE(SUM(total_cost),0) as total_cost
  FROM usage_log WHERE ${where}
`).get(...params);

console.log(`\n📊 ${period.toUpperCase()} REPORT`);
console.log('═'.repeat(50));
console.log(`  Calls:         ${summary.calls}`);
console.log(`  Input tokens:  ${summary.total_input.toLocaleString()}`);
console.log(`  Output tokens: ${summary.total_output.toLocaleString()}`);
console.log(`  Total cost:    $${summary.total_cost.toFixed(4)}`);

// By model
const byModel = db.prepare(`
  SELECT model, provider, COUNT(*) as calls,
         SUM(input_tokens) as inp, SUM(output_tokens) as outp,
         SUM(total_cost) as cost
  FROM usage_log WHERE ${where}
  GROUP BY model ORDER BY cost DESC
`).all(...params);

if (byModel.length > 0) {
  console.log(`\n  By Model:`);
  for (const r of byModel) {
    console.log(`    ${r.model.padEnd(22)} ${String(r.calls).padStart(4)} calls  $${r.cost.toFixed(4).padStart(10)}  [${r.provider}]`);
  }
}

// By task
const byTask = db.prepare(`
  SELECT COALESCE(task,'(none)') as task, COUNT(*) as calls, SUM(total_cost) as cost
  FROM usage_log WHERE ${where}
  GROUP BY task ORDER BY cost DESC
`).all(...params);

if (byTask.length > 0) {
  console.log(`\n  By Task:`);
  for (const r of byTask) {
    console.log(`    ${r.task.padEnd(22)} ${String(r.calls).padStart(4)} calls  $${r.cost.toFixed(4).padStart(10)}`);
  }
}

console.log('');
db.close();
