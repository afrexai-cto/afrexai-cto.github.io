# Meeting Action Items System

Automatically extracts action items from meeting transcripts (via Fathom), matches attendees to CRM contacts, and manages an approval-based task workflow.

## Architecture

```
Fathom API → Poller → Action Extractor → Approval Queue → Todoist
                ↓              ↓                              ↓
           Attendee       Waiting-On          Completion Check (3x daily)
           Matcher        Tracker             Auto-Archive (14 days)
                ↓
         CRM Contact
         Matching
```

## Components

| File | Purpose |
|---|---|
| `schema.sql` | SQLite schema (meetings, contacts, action_items, waiting_on, approval_queue) |
| `db.js` | Database connection and initialization |
| `fathom-poller.js` | Polls Fathom API every 5 min during business hours |
| `attendee-matcher.js` | Matches attendees to CRM contacts, updates relationship summaries |
| `action-extractor.js` | Extracts action items with ownership (mine/theirs) |
| `approval-queue.js` | Queues items for approval via Telegram/webhook |
| `todoist-sync.js` | Creates Todoist tasks for approved items |
| `completion-check.js` | 3x daily check: overdue, pending, waiting-on |
| `auto-archive.js` | Archives items older than 14 days |
| `config.json` | API keys and settings (placeholders) |

## Setup

```bash
npm install
npm run init-db
```

## Configuration

Edit `config.json` with your API keys:
- `fathom.apiKey` - Fathom API key
- `todoist.apiKey` - Todoist API key
- `approvalWebhook` - Telegram bot webhook URL
- `internalDomains` - Your company email domains

## Usage

```bash
# Poll for new transcripts
npm run poll

# Run completion check
npm run check

# Run auto-archive
npm run archive

# Run tests with sample data
npm run test
```

## Cron Schedule

```
*/5 9-18 * * 1-5  npm run poll      # Every 5 min, business hours
0 8,12,16 * * *   npm run check     # 3x daily
0 2 * * *         npm run archive   # Nightly archive
```

## Key Features

- **Calendar-aware**: Waits 2-minute buffer after meetings end before polling
- **Internal filtering**: Excludes internal team from "waiting on" tracking
- **Approval workflow**: Nothing goes to Todoist without explicit approval
- **Relationship context**: Each contact's summary updated with meeting context
- **Ownership tracking**: Distinguishes "my" action items from "theirs"
