# Urgent Email Detection System

AI-powered email urgency classifier that scans Gmail, classifies importance using Claude, and alerts on urgent messages.

## Architecture

```
Gmail API → Scanner → Noise Filter → AI Classifier → SQLite → Alert Output
                                          ↑
                                   Sender Reputation
                                   Feedback Loop
```

## Components

| File | Purpose |
|------|---------|
| `scanner.js` | Gmail fetcher + orchestration pipeline |
| `classifier.js` | Anthropic Claude classification + noise pre-filter + time gating |
| `feedback.js` | Correction submission + reputation updates + stats |
| `db.js` | SQLite helpers and prepared statements |
| `schema.sql` | Database schema |
| `config.json` | All configuration (noise lists, thresholds, schedule) |
| `test-pipeline.js` | End-to-end test with sample emails |

## Setup

1. **Install deps:** `npm install`
2. **Gmail OAuth:** Place `credentials.json` and `token.json` in this directory
3. **1Password:** Ensure `op://AfrexAI/Anthropic/api_key` is accessible
4. **Run:** `node scanner.js`

## Configuration

Edit `config.json`:
- **`noiseSenders`** / **`noiseDomains`**: Skip these without API calls
- **`scanning.wakingHours`**: When to run (GMT)
- **`classification.alertMinimumLabel`**: Minimum urgency to alert on (`high` by default)
- **`classification.model`**: Claude model to use

## Feedback Loop

```bash
# Correct a classification
node feedback.js correct <message_id> <low|medium|high|critical> "optional note"

# View accuracy stats
node feedback.js stats

# View sender reputation
node feedback.js reputation
```

Corrections update sender reputation scores, which are fed back into future classifications as context.

## Time Gating

- Weekdays: 5am–9pm GMT
- Weekends: 7am–9pm GMT
- Outside these hours, `scanner.js` exits silently

## Integration

Scanner outputs alerts as JSON to stdout. Pipe to webhook/Telegram:

```bash
node scanner.js | grep '^{' | while read line; do
  curl -X POST "$WEBHOOK_URL" -H 'Content-Type: application/json' -d "$line"
done
```

## Testing

```bash
npm test  # Runs test-pipeline.js with sample emails
```

Results written to `VALIDATION.md`.
