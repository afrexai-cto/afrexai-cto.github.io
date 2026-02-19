-- Urgent Email Detection - SQLite Schema

CREATE TABLE IF NOT EXISTS classifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT UNIQUE NOT NULL,
  thread_id TEXT,
  subject TEXT,
  sender TEXT,
  sender_domain TEXT,
  snippet TEXT,
  received_at TEXT,
  urgency_score REAL NOT NULL DEFAULT 0.0,  -- 0.0 to 1.0
  urgency_label TEXT NOT NULL DEFAULT 'low', -- low, medium, high, critical
  reasoning TEXT,
  alerted INTEGER NOT NULL DEFAULT 0,
  classified_at TEXT NOT NULL DEFAULT (datetime('now')),
  raw_headers TEXT
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  classification_id INTEGER NOT NULL REFERENCES classifications(id),
  correct_label TEXT,  -- what it should have been
  feedback_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sender_reputation (
  sender TEXT PRIMARY KEY,
  domain TEXT,
  total_emails INTEGER NOT NULL DEFAULT 0,
  urgent_count INTEGER NOT NULL DEFAULT 0,
  noise_count INTEGER NOT NULL DEFAULT 0,
  avg_urgency REAL NOT NULL DEFAULT 0.0,
  is_noise INTEGER NOT NULL DEFAULT 0,  -- manually flagged
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scan_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scanned_at TEXT NOT NULL DEFAULT (datetime('now')),
  emails_found INTEGER NOT NULL DEFAULT 0,
  emails_classified INTEGER NOT NULL DEFAULT 0,
  alerts_sent INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classifications_sender ON classifications(sender);
CREATE INDEX IF NOT EXISTS idx_classifications_label ON classifications(urgency_label);
CREATE INDEX IF NOT EXISTS idx_classifications_date ON classifications(classified_at);
CREATE INDEX IF NOT EXISTS idx_sender_rep_domain ON sender_reputation(domain);
