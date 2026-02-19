#!/usr/bin/env node
/**
 * Earnings Calendar — fetches upcoming earnings for watchlist tickers.
 * 
 * Usage:
 *   node earnings-calendar.js preview     — show upcoming earnings for watchlist
 *   node earnings-calendar.js sync        — sync calendar to DB & create scheduled jobs
 */
import { getDb } from './db.js';
import { fmpEarningsCalendar } from './api-client.js';
import config from './config.json' with { type: 'json' };

const db = getDb();

function getWatchlist() {
  return db.prepare('SELECT ticker FROM watchlist').all().map(r => r.ticker);
}

function dateRange(daysAhead = 14) {
  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);
  return { from, to };
}

function computeRunTime(reportDate, reportTime) {
  const delay = config.postEarningsDelayMinutes || 90;
  const d = new Date(reportDate);
  // bmo = before market open → run at market open + delay (9:30 ET + delay)
  // amc = after market close → run at close + delay (16:00 ET + delay)
  // default to amc
  if (reportTime === 'bmo') {
    d.setUTCHours(14, 30 + delay, 0, 0); // 9:30 ET = 14:30 UTC
  } else {
    d.setUTCHours(21, delay, 0, 0); // 16:00 ET = 21:00 UTC + delay
  }
  return d.toISOString();
}

export async function syncCalendar() {
  const tickers = getWatchlist();
  if (!tickers.length) {
    console.log('Watchlist empty — nothing to sync.');
    return [];
  }

  const { from, to } = dateRange(14);
  console.log(`Fetching earnings calendar ${from} → ${to}...`);

  let allEarnings;
  try {
    allEarnings = await fmpEarningsCalendar(from, to);
  } catch (e) {
    console.error('API error:', e.message);
    return [];
  }

  const tickerSet = new Set(tickers);
  const relevant = allEarnings.filter(e => tickerSet.has(e.symbol));

  const upsertCal = db.prepare(`
    INSERT OR REPLACE INTO earnings_calendar (ticker, report_date, report_time, fiscal_quarter, fiscal_year, eps_estimate, revenue_estimate)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const upsertJob = db.prepare(`
    INSERT OR IGNORE INTO scheduled_jobs (ticker, report_date, run_at)
    VALUES (?, ?, ?)
  `);

  const results = [];
  for (const e of relevant) {
    const time = e.time === 'bmo' ? 'bmo' : 'amc';
    upsertCal.run(e.symbol, e.date, time, e.fiscalDateEnding, null, e.epsEstimated, e.revenueEstimated);
    const runAt = computeRunTime(e.date, time);
    upsertJob.run(e.symbol, e.date, runAt);
    results.push({ ticker: e.symbol, date: e.date, time, epsEstimate: e.epsEstimated, runAt });
  }

  return results;
}

export function preview() {
  const tickers = getWatchlist();
  if (!tickers.length) {
    console.log('Watchlist is empty.');
    return;
  }

  const jobs = db.prepare(`
    SELECT j.ticker, j.report_date, j.run_at, j.status, c.eps_estimate, c.report_time
    FROM scheduled_jobs j
    LEFT JOIN earnings_calendar c ON j.ticker = c.ticker AND j.report_date = c.report_date
    WHERE j.status = 'pending'
    ORDER BY j.report_date
  `).all();

  if (!jobs.length) {
    console.log('No upcoming earnings scheduled. Run: node earnings-calendar.js sync');
    return;
  }

  console.log(`\n📅 Upcoming Earnings (${jobs.length} reports):\n`);
  for (const j of jobs) {
    const time = j.report_time === 'bmo' ? '🌅 Before Open' : '🌙 After Close';
    const est = j.eps_estimate != null ? `EPS est: $${j.eps_estimate}` : 'No estimate';
    console.log(`  ${j.ticker} — ${j.report_date} ${time} | ${est}`);
    console.log(`    → Job fires: ${j.run_at}\n`);
  }
}

// CLI
const [,, cmd] = process.argv;
if (cmd === 'sync') {
  syncCalendar().then(r => {
    console.log(`\nSynced ${r.length} earnings events.`);
    preview();
  });
} else if (cmd === 'preview') {
  preview();
} else {
  console.log('Usage: node earnings-calendar.js <sync|preview>');
}
