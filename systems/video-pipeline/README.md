# Video Idea Pipeline

Automated system that turns Slack mentions into researched, deduplicated video idea cards in Asana.

## Flow

```
@assistant potential video idea: <topic>
  → Read full Slack thread context
  → Semantic dedup check (>40% similarity = skip)
  → X/Twitter research (recent tweets, themes, angles)
  → Knowledge base search (related saved content)
  → Create Asana card with structured findings
  → Reply in Slack thread with link
```

## Files

| File | Purpose |
|------|---------|
| `pipeline.js` | Main orchestrator |
| `slack-listener.js` | Slack Socket Mode listener + Web API |
| `twitter-research.js` | X/Twitter API v2 recent search |
| `kb-search.js` | Knowledge base semantic search |
| `asana-client.js` | Asana REST API task creation |
| `dedup.js` | Embedding-based duplicate detection |
| `feedback.js` | Status tracking + pattern learning |
| `db.js` | SQLite database wrapper (sql.js) |
| `schema.sql` | Database schema |
| `config.json` | API keys (1Password refs) + settings |

## Setup

```bash
npm install

# Set env vars or use 1Password references in config.json:
# SLACK_BOT_TOKEN, SLACK_APP_TOKEN
# ASANA_ACCESS_TOKEN, ASANA_PROJECT_GID, ASANA_WORKSPACE_GID
# TWITTER_BEARER_TOKEN
# OPENAI_API_KEY
```

## Run

```bash
# Start Slack listener
node slack-listener.js

# Or use with 1Password
op run --env-file=op.env -- node slack-listener.js
```

## Test

```bash
node test.js  # 22 tests, all offline (no API calls)
```

## Pitch Statuses

`pitched` → `accepted` / `rejected` / `duplicate` → `produced`

## Duplicate Detection

Uses OpenAI `text-embedding-3-small` embeddings with cosine similarity. Threshold: 40% (configurable in `config.json`).

## Feedback Learning

`feedback.js` tracks accept/reject patterns and analyzes keyword frequency differences to surface what types of ideas tend to get accepted.
