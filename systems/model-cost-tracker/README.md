# Model Usage & Cost Tracker

Track AI API usage and costs across Anthropic, OpenAI, Google, and xAI.

## Requirements

- Node.js v22+ (uses built-in `node:sqlite`)
- No external dependencies

## Usage

### Log a call

```bash
node track.js log --model claude-opus-4-6 --input 5000 --output 2000 --task "email-scan"
```

### View rates

```bash
node track.js rates
```

### Reports

```bash
node report.js daily                          # Last 24h
node report.js weekly                         # Last 7 days
node report.js monthly                        # Last 30 days
node report.js daily --model gpt-4o           # Filter by model
node report.js monthly --task email-scan      # Filter by task
```

## Files

| File | Purpose |
|------|---------|
| `track.js` | CLI to log API calls |
| `report.js` | CLI to generate cost reports |
| `rates.json` | Configurable per-model pricing (per 1M tokens) |
| `schema.sql` | SQLite schema |
| `db.js` | Shared DB/rate helpers |
| `usage.jsonl` | Append-only JSONL log (created on first use) |
| `tracker.db` | SQLite database (created on first use) |

## Adding Models

Edit `rates.json` to add new models with input/output rates per 1M tokens.
