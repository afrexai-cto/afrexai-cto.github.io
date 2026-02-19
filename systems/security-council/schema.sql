-- Security Council - Findings Database Schema

CREATE TABLE IF NOT EXISTS scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  files_scanned INTEGER DEFAULT 0,
  total_findings INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running' -- running, completed, failed
);

CREATE TABLE IF NOT EXISTS findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scan_id INTEGER NOT NULL REFERENCES scans(id),
  finding_number INTEGER NOT NULL, -- sequential within scan
  severity TEXT NOT NULL CHECK(severity IN ('critical','high','medium','low','info')),
  perspective TEXT NOT NULL CHECK(perspective IN ('offensive','defensive','data_privacy','operational_realism')),
  title TEXT NOT NULL,
  file_path TEXT,
  line_range TEXT, -- e.g. "10-25"
  description TEXT NOT NULL,
  evidence TEXT, -- code snippet or detail
  recommendation TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(scan_id, finding_number)
);

CREATE TABLE IF NOT EXISTS deep_dives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  finding_id INTEGER NOT NULL REFERENCES findings(id),
  analysis TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_findings_scan ON findings(scan_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_perspective ON findings(perspective);
