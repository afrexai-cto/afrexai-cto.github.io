# Asana Integration

Connects to the Asana REST API for project/task management. Serves as the destination for video idea pipeline cards and feeds status data to the advisory council.

## Setup

1. Get a Personal Access Token from [Asana Developer Console](https://app.asana.com/0/developer-console)
2. Set `ASANA_PAT` env var or edit `config.json` → `asana.personalAccessToken`
3. Set your `workspaceGid` in config (find it at `https://app.asana.com/api/1.0/workspaces`)

## CLI Usage

```bash
# Sync all workspace data locally + export for advisory council
node sync.js              # Live mode
node sync.js --mock       # Test with mock data

# List tasks
node tasks.js list --project "Video Pipeline" --mock
node tasks.js list --section "Research"

# Create a task (video idea card)
node tasks.js create "AI Agents Deep Dive" --project "Video Pipeline" --section "Research" --notes "angles: ..." --due "2026-03-01"

# Add a comment (preserves history — never edits description)
node tasks.js comment task_001 "New source found: arxiv.org/abs/..."

# View task details + comments
node tasks.js view task_001 --mock

# Search tasks
node tasks.js search "AGI" --mock
```

## Architecture

- **asana-client.js** — REST API client (native fetch, zero deps)
- **sync.js** — Pulls workspace data, exports advisory council JSON
- **tasks.js** — CLI for task CRUD + comments
- **schema.sql** — SQLite schema for local caching
- **config.json** — Configuration (token, workspace, project defaults)

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/workspaces` | List workspaces |
| GET | `/projects?workspace={gid}` | List projects |
| GET | `/projects/{gid}/sections` | List sections |
| GET | `/tasks?project={gid}` | List tasks in project |
| GET | `/tasks/{gid}` | Get task details |
| POST | `/tasks` | Create task |
| POST | `/sections/{gid}/addTask` | Move task to section |
| GET | `/tasks/{gid}/stories` | Get comments/stories |
| POST | `/tasks/{gid}/stories` | Add comment |
| GET | `/workspaces/{gid}/tasks/search` | Search tasks |

## Design Decisions

- **Comments over edits**: When updating existing cards, new info goes as comments (POST /stories) to preserve history. Descriptions are never overwritten.
- **Zero dependencies**: Uses Node 18+ native `fetch`. No npm install needed.
- **Advisory council export**: `data/advisory-council-export.json` contains structured pipeline status for consumption by other systems.

## Data Flow

```
Asana API → sync.js → data/sync-latest.json
                     → data/advisory-council-export.json → Advisory Council
                     
tasks.js create → Asana API (POST /tasks)
tasks.js comment → Asana API (POST /tasks/{gid}/stories)
```
