# Social Media Tracker

Daily snapshot and reporting system for YouTube, Instagram, X/Twitter, and TikTok metrics.

## Setup

1. Edit `config.json` with your API keys and account IDs
2. Set `"useMockData": false` to use real APIs

No npm dependencies required — uses Node.js built-in `node:sqlite` (Node 22.5+).

## CLI Usage

```bash
# Snapshot all platforms
node snapshot.js all

# Snapshot individual platform
node snapshot.js youtube
node snapshot.js instagram
node snapshot.js twitter
node snapshot.js tiktok

# Yesterday's report (for daily briefing)
node report.js yesterday

# Specific date
node report.js 2026-02-18

# JSON output (for advisory council integration)
node report.js yesterday --json
```

## Architecture

```
social-tracker/
├── config.json          # API keys and settings
├── schema.sql           # SQLite schema
├── db.js                # Database wrapper (node:sqlite)
├── snapshot.js          # CLI entry: take daily snapshots
├── report.js            # CLI entry: generate reports
├── platforms/
│   ├── youtube.js       # YouTube Data API v3
│   ├── instagram.js     # Instagram Graph API
│   ├── twitter.js       # X API v2
│   └── tiktok.js        # TikTok Research API
└── data/
    └── social-tracker.db  # SQLite database (auto-created)
```

## API Endpoints Used

| Platform | Endpoint | Auth |
|----------|----------|------|
| YouTube | `GET /youtube/v3/channels?part=statistics` | API Key |
| YouTube | `GET /youtube/v3/search?part=snippet&type=video` | API Key |
| YouTube | `GET /youtube/v3/videos?part=snippet,statistics,contentDetails` | API Key |
| Instagram | `GET /{account-id}?fields=followers_count,...` | Access Token |
| Instagram | `GET /{account-id}/insights?metric=impressions,reach,profile_views&period=day` | Access Token |
| Instagram | `GET /{account-id}/media?fields=id,caption,...` | Access Token |
| Instagram | `GET /{media-id}/insights?metric=impressions,reach,saved,engagement` | Access Token |
| X/Twitter | `GET /2/users/{id}?user.fields=public_metrics` | Bearer Token |
| X/Twitter | `GET /2/users/{id}/tweets?tweet.fields=created_at,public_metrics` | Bearer Token |
| TikTok | `POST /v2/research/user/info/?fields=follower_count,...` | Bearer Token |

## Features

- **Subscriber Conversion Analysis** (YouTube): Correlates per-video view growth with subscriber deltas to identify which videos drive subscriptions vs. just views
- **Mock Data Fallback**: Set `useMockData: true` in config for testing without API keys
- **Advisory Council Integration**: `report.js` exports `getReportJSON()` for programmatic access
- **SQLite WAL mode**: Safe for concurrent reads during report generation
