-- Meeting Action Items System Schema

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  fathom_id TEXT UNIQUE,
  title TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  transcript TEXT,
  summary TEXT,
  processed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  is_internal INTEGER DEFAULT 0,
  relationship_summary TEXT DEFAULT '',
  crm_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meeting_attendees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id TEXT NOT NULL REFERENCES meetings(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  role TEXT DEFAULT 'attendee',
  UNIQUE(meeting_id, contact_id)
);

CREATE TABLE IF NOT EXISTS action_items (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id),
  description TEXT NOT NULL,
  owner_contact_id TEXT REFERENCES contacts(id),
  ownership TEXT CHECK(ownership IN ('mine', 'theirs', 'shared')) NOT NULL,
  status TEXT CHECK(status IN ('pending_approval', 'approved', 'in_progress', 'done', 'archived', 'rejected')) DEFAULT 'pending_approval',
  due_date TEXT,
  todoist_task_id TEXT,
  priority INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS waiting_on (
  id TEXT PRIMARY KEY,
  action_item_id TEXT REFERENCES action_items(id),
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  description TEXT NOT NULL,
  status TEXT CHECK(status IN ('waiting', 'received', 'overdue', 'archived')) DEFAULT 'waiting',
  due_date TEXT,
  last_checked_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS approval_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_item_id TEXT NOT NULL REFERENCES action_items(id),
  payload TEXT NOT NULL,
  delivered INTEGER DEFAULT 0,
  delivered_at TEXT,
  response TEXT CHECK(response IN ('approved', 'rejected', NULL)),
  responded_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS poll_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  polled_at TEXT DEFAULT (datetime('now')),
  meetings_found INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ok',
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_meeting ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_waiting_on_status ON waiting_on(status);
CREATE INDEX IF NOT EXISTS idx_meetings_fathom ON meetings(fathom_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
