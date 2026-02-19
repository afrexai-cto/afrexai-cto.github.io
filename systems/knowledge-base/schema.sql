-- Knowledge Base Schema
-- SQLite with manual vector storage (embeddings as JSON arrays)

CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('article', 'youtube', 'twitter', 'pdf', 'other')),
  title TEXT,
  author TEXT,
  published_at TEXT,         -- ISO 8601
  ingested_at TEXT NOT NULL DEFAULT (datetime('now')),
  content_text TEXT,          -- full extracted text
  summary TEXT,               -- short summary
  metadata JSON,              -- extra fields per type
  source_weight REAL DEFAULT 1.0  -- importance weight for ranking
);

CREATE TABLE IF NOT EXISTS chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  embedding JSON,             -- float[] stored as JSON array
  token_count INTEGER,
  UNIQUE(source_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('person', 'company', 'concept', 'place', 'other')),
  canonical_name TEXT,        -- normalized form
  UNIQUE(name, type)
);

CREATE TABLE IF NOT EXISTS source_entities (
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  entity_id INTEGER NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relevance REAL DEFAULT 1.0,
  PRIMARY KEY(source_id, entity_id)
);

CREATE TABLE IF NOT EXISTS cross_references (
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  linked_source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'references',
  PRIMARY KEY(source_id, linked_source_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(type);
CREATE INDEX IF NOT EXISTS idx_sources_ingested ON sources(ingested_at);
CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(canonical_name);
