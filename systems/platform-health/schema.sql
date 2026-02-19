-- Platform Health Council - SQLite Schema
CREATE TABLE IF NOT EXISTS health_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_at TEXT NOT NULL DEFAULT (datetime('now')),
  overall_score REAL,
  summary TEXT
);

CREATE TABLE IF NOT EXISTS health_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL REFERENCES health_runs(id),
  area TEXT NOT NULL,
  score REAL NOT NULL,        -- 0-100
  status TEXT NOT NULL,       -- healthy, warning, critical
  findings TEXT,              -- JSON array of findings
  recommendations TEXT,       -- JSON array of recommendations
  raw_data TEXT               -- JSON blob of raw analysis data
);

CREATE TABLE IF NOT EXISTS health_trends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  area TEXT NOT NULL,
  score REAL NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_results_run ON health_results(run_id);
CREATE INDEX IF NOT EXISTS idx_trends_area ON health_trends(area, recorded_at);
