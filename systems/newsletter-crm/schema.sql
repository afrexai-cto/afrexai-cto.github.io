-- Newsletter & CRM Integration Schema

CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',  -- active, inactive, churned
  created_at TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referral_code TEXT,
  tags TEXT,  -- JSON array
  custom_fields TEXT,  -- JSON object
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subscriber_segments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subscriber_count INTEGER DEFAULT 0,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT,
  slug TEXT,
  status TEXT,  -- draft, confirmed, archived
  publish_date TEXT,
  displayed_date TEXT,
  audience TEXT,  -- free, premium, both
  web_url TEXT,
  stats_opens INTEGER DEFAULT 0,
  stats_clicks INTEGER DEFAULT 0,
  stats_recipients INTEGER DEFAULT 0,
  stats_open_rate REAL DEFAULT 0,
  stats_click_rate REAL DEFAULT 0,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  name TEXT,
  stage TEXT,
  pipeline TEXT,
  amount REAL DEFAULT 0,
  close_date TEXT,
  owner_id TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  lifecycle_stage TEXT,
  lead_status TEXT,
  created_at TEXT,
  updated_at TEXT,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pipelines (
  id TEXT PRIMARY KEY,
  label TEXT,
  display_order INTEGER,
  stages TEXT,  -- JSON array of {id, label, displayOrder}
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  entity TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  status TEXT NOT NULL,  -- success, error
  error_message TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline ON deals(pipeline);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
