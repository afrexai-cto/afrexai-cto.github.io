-- Advisory Council Schema
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  context TEXT,
  summary TEXT
);

CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER REFERENCES sessions(id),
  number INTEGER NOT NULL,
  persona TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  priority TEXT CHECK(priority IN ('critical','high','medium','low')) DEFAULT 'medium',
  category TEXT,
  confidence REAL DEFAULT 0.5,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recommendation_id INTEGER REFERENCES recommendations(id),
  action TEXT CHECK(action IN ('approve','reject','defer','note')) NOT NULL,
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS preference_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  persona TEXT NOT NULL,
  category TEXT,
  priority_bias REAL DEFAULT 0.0,
  approval_rate REAL DEFAULT 0.5,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deep_dives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recommendation_id INTEGER REFERENCES recommendations(id),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rec_session ON recommendations(session_id);
CREATE INDEX IF NOT EXISTS idx_rec_persona ON recommendations(persona);
CREATE INDEX IF NOT EXISTS idx_feedback_rec ON feedback(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_prefs_persona ON preference_signals(persona);
