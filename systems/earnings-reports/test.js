#!/usr/bin/env node
/**
 * Test suite — validates the system with sample data (no API keys needed).
 */
import { getDb } from './db.js';
import { generateSampleReport } from './report-generator.js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = getDb();
const results = [];

function log(msg) {
  console.log(msg);
  results.push(msg);
}

function assert(condition, label) {
  if (condition) log(`✅ ${label}`);
  else { log(`❌ ${label}`); throw new Error(`FAILED: ${label}`); }
}

// Test 1: Watchlist CRUD
log('## Test 1: Watchlist CRUD\n');
db.prepare('DELETE FROM watchlist').run();
db.prepare('INSERT INTO watchlist (ticker, notes) VALUES (?, ?)').run('AAPL', 'Tech giant');
db.prepare('INSERT INTO watchlist (ticker, notes) VALUES (?, ?)').run('MSFT', 'Cloud king');
db.prepare('INSERT INTO watchlist (ticker, notes) VALUES (?, ?)').run('TSLA', 'EV play');

let rows = db.prepare('SELECT * FROM watchlist ORDER BY ticker').all();
assert(rows.length === 3, 'Watchlist has 3 tickers');
assert(rows[0].ticker === 'AAPL', 'First ticker is AAPL');

db.prepare('DELETE FROM watchlist WHERE ticker = ?').run('TSLA');
rows = db.prepare('SELECT * FROM watchlist').all();
assert(rows.length === 2, 'Watchlist has 2 after removal');

// Test 2: Earnings calendar + job scheduling
log('\n## Test 2: Earnings Calendar & Job Scheduling\n');
db.prepare('DELETE FROM earnings_calendar').run();
db.prepare('DELETE FROM scheduled_jobs').run();

const sampleEarnings = [
  { ticker: 'AAPL', date: '2026-01-30', time: 'amc', eps_est: 2.35 },
  { ticker: 'MSFT', date: '2026-01-28', time: 'amc', eps_est: 3.12 },
];

for (const e of sampleEarnings) {
  db.prepare('INSERT INTO earnings_calendar (ticker, report_date, report_time, eps_estimate) VALUES (?, ?, ?, ?)').run(e.ticker, e.date, e.time, e.eps_est);
  const runAt = new Date('2026-01-30T22:30:00Z').toISOString(); // simulated
  db.prepare('INSERT INTO scheduled_jobs (ticker, report_date, run_at) VALUES (?, ?, ?)').run(e.ticker, e.date, runAt);
}

const jobs = db.prepare('SELECT * FROM scheduled_jobs WHERE status = ?').all('pending');
assert(jobs.length === 2, '2 pending jobs created');

// Test 3: Report generation with sample data
log('\n## Test 3: Narrative Report Generation\n');

const aaplReport = generateSampleReport('AAPL', {
  epsActual: 2.42,
  epsEstimate: 2.35,
  priceChange: 3.2,
  priceBefore: 228.50,
  priceAfter: 235.81,
  newsHeadlines: [
    'iPhone revenue surged 8% YoY, driven by strong Pro model demand',
    'Services revenue hit all-time high at $26.3B, growing 14%',
    'Guidance hints at AI-powered features boosting upgrade cycle in Q2'
  ]
});
assert(aaplReport.verdict === 'beat', 'AAPL verdict is beat');
assert(aaplReport.narrative.includes('beat expectations'), 'Narrative mentions beat');
assert(aaplReport.narrative.includes('3.2%'), 'Narrative includes price change');
log('\nAAPL Sample Report:\n' + aaplReport.narrative);

const tslaReport = generateSampleReport('TSLA', {
  epsActual: 0.45,
  epsEstimate: 0.58,
  priceChange: -8.5,
  priceBefore: 245.00,
  priceAfter: 224.18,
  newsHeadlines: [
    'Automotive margins fell to 16.3%, lowest in two years as price cuts bite',
    'Cybertruck production ramp slower than expected, contributing losses',
    'Energy storage revenue doubled but couldn\'t offset vehicle weakness'
  ]
});
assert(tslaReport.verdict === 'miss', 'TSLA verdict is miss');
assert(tslaReport.narrative.includes('missed expectations'), 'Narrative mentions miss');
log('\nTSLA Sample Report:\n' + tslaReport.narrative);

const metReport = generateSampleReport('GOOG', {
  epsActual: 1.89,
  epsEstimate: 1.88,
  priceChange: 0.3,
  priceBefore: 178.20,
  priceAfter: 178.73,
  newsHeadlines: [
    'Search revenue grew 12%, steady but unremarkable',
    'Cloud division finally profitable, margin improved to 9%',
    'YouTube ad revenue slightly below expectations amid TikTok competition'
  ]
});
assert(metReport.verdict === 'met', 'GOOG verdict is met');
log('\nGOOG Sample Report:\n' + metReport.narrative);

// Test 4: Job lifecycle
log('\n## Test 4: Job Lifecycle\n');
db.prepare("UPDATE scheduled_jobs SET status = 'completed' WHERE ticker = 'AAPL'").run();
const completed = db.prepare("SELECT * FROM scheduled_jobs WHERE status = 'completed'").all();
assert(completed.length === 1, '1 completed job');

db.prepare("DELETE FROM scheduled_jobs WHERE status = 'completed'").run();
const remaining = db.prepare('SELECT * FROM scheduled_jobs').all();
assert(remaining.length === 1, '1 job remaining after auto-delete');
assert(remaining[0].ticker === 'MSFT', 'Remaining job is MSFT');

// Test 5: Past reports storage
log('\n## Test 5: Past Reports Storage\n');
db.prepare('DELETE FROM past_reports').run();
db.prepare(`INSERT INTO past_reports (ticker, report_date, eps_actual, eps_estimate, verdict, price_change_pct, narrative)
  VALUES (?, ?, ?, ?, ?, ?, ?)`).run('AAPL', '2026-01-30', 2.42, 2.35, 'beat', 3.2, aaplReport.narrative);

const pastReport = db.prepare('SELECT * FROM past_reports WHERE ticker = ?').get('AAPL');
assert(pastReport !== undefined, 'Past report stored');
assert(pastReport.verdict === 'beat', 'Past report verdict correct');

log('\n## All tests passed! ✅\n');

// Write VALIDATION.md
const validation = `# Earnings Reports System — Validation Results

Generated: ${new Date().toISOString()}

${results.join('\n')}
`;

writeFileSync(join(__dirname, 'VALIDATION.md'), validation);
console.log('Results written to VALIDATION.md');
