# AfrexAI Follow-Up Engine

Automated cold email follow-up system that reads the prospect tracker, generates personalised follow-up emails by vertical, and saves them as Gmail drafts.

## Follow-Up Sequence

| Step | Day | Purpose | Status Value |
|------|-----|---------|-------------|
| Follow-up 1 | Day 3 | Friendly bump | `follow-up-1` |
| Follow-up 2 | Day 7 | Value-add / case study | `follow-up-2` |
| Follow-up 3 | Day 14 | Breakup email | `follow-up-3` |

## Verticals

The engine auto-classifies prospects by industry and customises content:
- **Legal** → VADIS references
- **Construction/Architecture** → SiteVoice references
- **Agency/Marketing** → White-label AI tooling
- **SaaS/Tech** → Product integration AI
- **Healthcare/Dental** → Patient comms automation
- **Finance/Accounting** → Document workflow automation
- **E-commerce** → CX personalisation
- **Recruitment** → Candidate matching AI
- **Logistics** → Route/demand optimisation
- **Real Estate** → Lead nurturing AI
- **Manufacturing** → Predictive maintenance
- **EdTech** → Adaptive learning
- **Hospitality** → Guest experience AI
- **Consulting** → Research/report automation
- **IT/MSP** → Ticket triage automation

## Setup

### 1. Install dependencies

```bash
cd /Users/openclaw/.openclaw/workspace-main/outbound
npm init -y
npm install googleapis
```

### 2. Gmail OAuth credentials

Place your Google OAuth credentials at:
- `../credentials/gmail-oauth.json` — OAuth client credentials
- `../credentials/gmail-token.json` — OAuth refresh token

Or set environment variables:
```bash
export GMAIL_CREDENTIALS=/path/to/credentials.json
export GMAIL_TOKEN=/path/to/token.json
export SENDER_EMAIL=kalin@afrexai.com
```

### 3. Run

```bash
# Preview what would happen (no drafts created, no CSV changes)
node follow-up-engine.js --dry-run

# Create drafts and update CSV
node follow-up-engine.js
```

## Cron Job Setup

Run daily at 9 AM:

```bash
# Edit crontab
crontab -e

# Add this line:
0 9 * * * cd /Users/openclaw/.openclaw/workspace-main/outbound && /usr/local/bin/node follow-up-engine.js >> /tmp/afrexai-followup.log 2>&1
```

Or use OpenClaw's built-in cron:
```
openclaw cron add --name "follow-up-engine" --schedule "0 9 * * *" --command "node /Users/openclaw/.openclaw/workspace-main/outbound/follow-up-engine.js"
```

Or via launchd (macOS):
```bash
# Save as ~/Library/LaunchAgents/com.afrexai.followup.plist
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.afrexai.followup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/openclaw/.openclaw/workspace-main/outbound/follow-up-engine.js</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/afrexai-followup.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/afrexai-followup-err.log</string>
</dict>
</plist>
```

Then: `launchctl load ~/Library/LaunchAgents/com.afrexai.followup.plist`

## CSV Status Flow

```
sent → follow-up-1 → follow-up-2 → follow-up-3 (done)
     ↘ replied (manual — stops sequence)
     ↘ bounced (skipped)
```

Mark a prospect as `replied` in the CSV to stop follow-ups.
