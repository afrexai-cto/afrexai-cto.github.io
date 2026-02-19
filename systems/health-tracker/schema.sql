CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('food','drink','symptom','note')),
  description TEXT NOT NULL,
  severity INTEGER CHECK(severity IS NULL OR (severity >= 1 AND severity <= 5)),
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  date TEXT NOT NULL DEFAULT (date('now'))
);

CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
