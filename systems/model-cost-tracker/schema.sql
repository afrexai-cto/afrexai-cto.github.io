CREATE TABLE IF NOT EXISTS usage_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  model TEXT NOT NULL,
  provider TEXT,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  task TEXT,
  input_cost REAL NOT NULL,
  output_cost REAL NOT NULL,
  total_cost REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_timestamp ON usage_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_model ON usage_log(model);
CREATE INDEX IF NOT EXISTS idx_task ON usage_log(task);
