# Personal CRM

A local-first Personal CRM powered by SQLite with vector embeddings for natural language queries.

## Setup

```bash
npm install
```

Requires 1Password CLI (`op`) with vault "AfrexAI" containing:
- **Gmail OAuth**: `client_id`, `client_secret`, `refresh_token`
- **OpenAI**: `api_key` (for embeddings)

## Usage

### Scan Gmail for contacts
```bash
node scanner.js                    # scan (default 5 pages)
CRM_SCAN_PAGES=20 node scanner.js  # scan more pages
```

### Query contacts (natural language)
```bash
node query.js "who do I know at NVIDIA?"
node query.js "who haven't I talked to in a while?"
node query.js "list all contacts"
node query.js "people at Google"
```

### Relationship health scores
```bash
node health-scores.js
```
Scores 0-100 based on recency (40pts), frequency (30pts), reciprocity (30pts). Flags stale relationships (score < 30).

### Duplicate detection
```bash
node dedup.js                        # find duplicates
node dedup.js merge <keep_id> <remove_id>  # merge contacts
```

### Follow-up reminders
```bash
node reminders.js                              # show pending
node reminders.js create <contact_id> "Call about project" "2025-03-01"
node reminders.js snooze <reminder_id> 7       # snooze 7 days
node reminders.js done <reminder_id>           # mark complete
```

## Architecture

- **SQLite** (better-sqlite3) — single `crm.db` file
- **Vector embeddings** (OpenAI text-embedding-3-small) stored as BLOB for similarity search
- **Gmail API** for email scanning with incremental page tokens
- **Noise filtering** — auto-detects marketing/newsletter senders

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | Database schema |
| `db.js` | Shared DB, noise filter, embedding utils |
| `embeddings.js` | OpenAI embedding generation |
| `scanner.js` | Gmail scanner |
| `query.js` | Natural language query CLI |
| `health-scores.js` | Relationship health calculator |
| `dedup.js` | Duplicate detection + merge |
| `reminders.js` | Follow-up reminder CRUD |
