-- Asana Integration Local Cache Schema
-- Used for offline access and advisory council exports

CREATE TABLE IF NOT EXISTS workspaces (
  gid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  gid TEXT PRIMARY KEY,
  workspace_gid TEXT NOT NULL REFERENCES workspaces(gid),
  name TEXT NOT NULL,
  archived INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT,
  modified_at TEXT,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sections (
  gid TEXT PRIMARY KEY,
  project_gid TEXT NOT NULL REFERENCES projects(gid),
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
  gid TEXT PRIMARY KEY,
  project_gid TEXT REFERENCES projects(gid),
  section_gid TEXT REFERENCES sections(gid),
  name TEXT NOT NULL,
  notes TEXT,
  completed INTEGER DEFAULT 0,
  assignee_name TEXT,
  due_on TEXT,
  created_at TEXT,
  modified_at TEXT,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
  gid TEXT PRIMARY KEY,
  task_gid TEXT NOT NULL REFERENCES tasks(gid),
  text TEXT NOT NULL,
  author_name TEXT,
  created_at TEXT NOT NULL,
  synced_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_gid);
CREATE INDEX IF NOT EXISTS idx_tasks_section ON tasks(section_gid);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_gid);

-- View: Pipeline status for advisory council
CREATE VIEW IF NOT EXISTS v_pipeline_status AS
SELECT
  s.name AS section,
  COUNT(t.gid) AS task_count,
  SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) AS completed_count,
  SUM(CASE WHEN t.completed = 0 AND t.due_on < date('now') THEN 1 ELSE 0 END) AS overdue_count
FROM tasks t
JOIN sections s ON t.section_gid = s.gid
JOIN projects p ON s.project_gid = p.gid
WHERE p.name = 'Video Pipeline'
GROUP BY s.name;
