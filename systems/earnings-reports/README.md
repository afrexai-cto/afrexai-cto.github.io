# Earnings Reports System

Automated earnings tracking: watchlist → calendar sync → scheduled jobs → narrative summaries.

## Setup

```bash
npm install
# Edit config.json with your API keys (FMP + Alpha Vantage)
```

## Usage

### Manage your watchlist
```bash
node watchlist.js add AAPL "Tech giant"
node watchlist.js add MSFT
node watchlist.js list
node watchlist.js remove TSLA
```

### Sync earnings calendar & schedule jobs
```bash
node earnings-calendar.js sync      # Fetch upcoming earnings, create jobs
node earnings-calendar.js preview   # Show what's scheduled
```

### Process earnings reports
```bash
node scheduler.js run       # Process all due jobs (run via cron every 15 min)
node scheduler.js status    # Show all pending/completed jobs
node scheduler.js cleanup   # Remove completed/failed jobs
```

### Test
```bash
npm test    # Run with sample data, writes VALIDATION.md
```

## Architecture

| File | Purpose |
|------|---------|
| `config.json` | API keys, DB path, timing settings |
| `db.js` | SQLite connection + schema init |
| `schema.sql` | Database schema (watchlist, calendar, jobs, reports) |
| `api-client.js` | FMP (primary) + Alpha Vantage (fallback) API clients |
| `watchlist.js` | CLI for watchlist management |
| `earnings-calendar.js` | Fetches earnings dates, creates scheduled jobs |
| `report-generator.js` | Produces narrative earnings summaries |
| `scheduler.js` | Processes due jobs, auto-deletes completed ones |

## Workflow

1. **Sunday 9am** — `earnings-calendar.js sync` fetches the week's earnings for your watchlist
2. **Preview delivered** — upcoming earnings summary sent to you for ticker selection
3. **Jobs created** — one-time jobs scheduled for ~90 min after each earnings release
4. **Jobs fire** — `scheduler.js run` (every 15 min via cron) catches due jobs
5. **Narrative delivered** — beat/miss verdict, market reaction, key takeaways
6. **Auto-cleanup** — completed jobs deleted automatically

## APIs

- **Financial Modeling Prep** (primary): earnings calendar, surprises, quotes, news
- **Alpha Vantage** (fallback): earnings calendar, earnings data, quotes
