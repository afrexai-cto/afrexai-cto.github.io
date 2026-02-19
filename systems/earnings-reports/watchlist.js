#!/usr/bin/env node
/**
 * Watchlist management CLI
 * Usage:
 *   node watchlist.js add AAPL
 *   node watchlist.js add AAPL "Tech giant, iPhone maker"
 *   node watchlist.js remove AAPL
 *   node watchlist.js list
 */
import { getDb } from './db.js';

const db = getDb();
const [,, command, ticker, notes] = process.argv;

function add(ticker, notes = null) {
  ticker = ticker.toUpperCase();
  db.prepare('INSERT OR REPLACE INTO watchlist (ticker, notes) VALUES (?, ?)').run(ticker, notes);
  console.log(`✅ Added ${ticker} to watchlist`);
}

function remove(ticker) {
  ticker = ticker.toUpperCase();
  const result = db.prepare('DELETE FROM watchlist WHERE ticker = ?').run(ticker);
  if (result.changes) console.log(`🗑️  Removed ${ticker} from watchlist`);
  else console.log(`⚠️  ${ticker} not found in watchlist`);
}

function list() {
  const rows = db.prepare('SELECT ticker, notes, added_at FROM watchlist ORDER BY ticker').all();
  if (!rows.length) {
    console.log('Watchlist is empty. Add tickers with: node watchlist.js add AAPL');
    return;
  }
  console.log(`\n📋 Watchlist (${rows.length} tickers):\n`);
  for (const r of rows) {
    const note = r.notes ? ` — ${r.notes}` : '';
    console.log(`  ${r.ticker}${note}  (added ${r.added_at})`);
  }
  console.log();
}

switch (command) {
  case 'add':
    if (!ticker) { console.error('Usage: node watchlist.js add TICKER [notes]'); process.exit(1); }
    add(ticker, notes);
    break;
  case 'remove':
  case 'rm':
    if (!ticker) { console.error('Usage: node watchlist.js remove TICKER'); process.exit(1); }
    remove(ticker);
    break;
  case 'list':
  case 'ls':
    list();
    break;
  default:
    console.log('Usage: node watchlist.js <add|remove|list> [TICKER] [notes]');
}
