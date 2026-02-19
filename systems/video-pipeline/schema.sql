-- Video Idea Pipeline Schema
CREATE TABLE IF NOT EXISTS pitches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idea TEXT NOT NULL,
  slack_channel TEXT,
  slack_thread_ts TEXT,
  slack_user TEXT,
  thread_context TEXT,          -- full thread JSON
  research_findings TEXT,       -- twitter research JSON
  kb_sources TEXT,              -- knowledge base matches JSON
  suggested_angles TEXT,        -- JSON array of angles
  asana_task_gid TEXT,
  asana_url TEXT,
  status TEXT DEFAULT 'pitched' CHECK(status IN ('pitched','accepted','rejected','produced','duplicate')),
  duplicate_of INTEGER REFERENCES pitches(id),
  similarity_score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pitch_embeddings (
  pitch_id INTEGER PRIMARY KEY REFERENCES pitches(id),
  embedding BLOB NOT NULL       -- float32 array stored as blob
);

CREATE TABLE IF NOT EXISTS feedback_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pitch_id INTEGER REFERENCES pitches(id),
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT,
  content TEXT,
  tags TEXT,                    -- comma-separated
  embedding BLOB,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pitches_status ON pitches(status);
CREATE INDEX IF NOT EXISTS idx_pitches_created ON pitches(created_at);
