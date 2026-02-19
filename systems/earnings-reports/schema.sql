-- Earnings Reports System Schema

CREATE TABLE IF NOT EXISTS watchlist (
  ticker TEXT PRIMARY KEY,
  added_at TEXT DEFAULT (datetime('now')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS earnings_calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  report_date TEXT NOT NULL,
  report_time TEXT, -- 'bmo' (before market open), 'amc' (after market close), 'dmh' (during market hours)
  fiscal_quarter TEXT,
  fiscal_year TEXT,
  eps_estimate REAL,
  revenue_estimate REAL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(ticker, report_date)
);

CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  report_date TEXT NOT NULL,
  run_at TEXT NOT NULL, -- ISO datetime when job should fire
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(ticker, report_date)
);

CREATE TABLE IF NOT EXISTS past_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  report_date TEXT NOT NULL,
  eps_actual REAL,
  eps_estimate REAL,
  revenue_actual REAL,
  revenue_estimate REAL,
  verdict TEXT, -- 'beat', 'miss', 'met'
  price_before REAL,
  price_after REAL,
  price_change_pct REAL,
  narrative TEXT,
  delivered_at TEXT DEFAULT (datetime('now')),
  UNIQUE(ticker, report_date)
);
