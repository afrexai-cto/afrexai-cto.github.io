# Newsletter & CRM Platform Integration

Beehiiv + HubSpot integration with local SQLite cache and advisory council data feed.

## Setup

```bash
# No external dependencies needed (uses Node.js built-in sqlite)
# Requires Node.js 22+
# Configure API keys in config.json (stubs provided)
```

## Sync Data

```bash
node sync.js beehiiv    # Sync subscribers, posts, segments from Beehiiv
node sync.js hubspot    # Sync deals, contacts, pipelines from HubSpot
node sync.js all        # Sync everything
```

## Reports

```bash
node report.js subscribers  # Newsletter subscriber metrics
node report.js deals        # CRM deal pipeline metrics
node report.js overview     # Combined overview
```

## Testing

```bash
node test-mock.js  # Run with mock data, writes VALIDATION.md
```

## Architecture

- **platforms/beehiiv.js** — Beehiiv API v2 client (subscriptions, posts, segments)
- **platforms/hubspot.js** — HubSpot CRM v3 client (deals, contacts, pipelines)
- **db.js** — SQLite layer with upsert and sync logging
- **schema.sql** — Database schema
- **config.json** — API keys and settings (`mock: true` for development)

## Advisory Council Integration

Both platform modules export `getAdvisoryData()` returning structured summaries:

```js
const beehiiv = require('./platforms/beehiiv');
const hubspot = require('./platforms/hubspot');
const data = { ...beehiiv.getAdvisoryData(), ...hubspot.getAdvisoryData() };
```

## API Endpoints Used

### Beehiiv v2
- `GET /v2/publications/{pubId}/subscriptions` — List subscribers
- `GET /v2/publications/{pubId}/posts` — List posts with stats
- `GET /v2/publications/{pubId}/segments` — List segments

### HubSpot v3
- `GET /crm/v3/objects/deals` — List deals
- `GET /crm/v3/objects/contacts` — List contacts
- `GET /crm/v3/pipelines/deals` — List deal pipelines
