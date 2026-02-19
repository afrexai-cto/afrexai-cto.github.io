# Google Workspace Integration

CLI tools for Gmail, Calendar, Drive, and Docs/Sheets/Slides via Google APIs with OAuth2.

## Setup

### 1. Google Cloud Console
1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable APIs: Gmail, Calendar, Drive, Docs, Sheets, Slides, People
3. Create OAuth 2.0 credentials (Desktop app type)
4. Add `http://localhost:3891/oauth2callback` as authorized redirect URI

### 2. Store Credentials in 1Password
```bash
# Store the downloaded OAuth JSON as a secure note field
op item create --vault AfrexAI --category "Secure Note" \
  --title "Google-Workspace-OAuth" \
  'credentials[text]=$(cat ~/Downloads/credentials.json)' \
  'encryption-key[password]=<your-backup-encryption-key>'
```

### 3. Install & Authenticate
```bash
cd systems/google-workspace
npm install
node auth.js          # Opens browser for OAuth consent
node auth.js status   # Verify authentication
```

## Usage

### Gmail
```bash
node gmail.js scan                        # Scan inbox (20 recent)
node gmail.js scan 50                     # Scan more
node gmail.js contacts                    # List Google contacts
node gmail.js urgent                      # Show urgent emails only
node gmail.js briefing                    # Email briefing for AI context
node gmail.js draft "to@x.com" "Subj" "Body"  # Create draft
node gmail.js send-draft <draftId>        # Send approved draft
```

### Calendar
```bash
node calendar.js today                    # Today's events
node calendar.js upcoming 14             # Next 14 days
node calendar.js next                    # Next event
node calendar.js check "2026-02-20T10:00" 60  # Double-booking check
node calendar.js attendees <eventId>     # Event attendee details
node calendar.js ending 5               # Events ending within 5min
```

### Drive
```bash
node drive.js upload file.tar.gz         # Upload (auto-encrypts backups)
node drive.js upload file.pdf <folderId> # Upload to specific folder
node drive.js list                       # List recent files
node drive.js list "report"              # Search files
node drive.js download <fileId> out.pdf  # Download
node drive.js mkdir "Backups"            # Create folder
```

### Docs/Sheets/Slides
```bash
node docs.js create "Meeting Notes"      # Create Google Doc
node docs.js sheet "Budget 2026"         # Create Spreadsheet
node docs.js slides "Q1 Deck"            # Create Presentation
node docs.js share <id> user@x.com writer  # Share with permissions
node docs.js write <docId> "Content..."  # Append text to Doc
```

## Security

- **Credentials**: Loaded at runtime from 1Password (`op read`)
- **Tokens**: Stored in `tokens/` (gitignored, mode 600)
- **Backups**: Auto-encrypted with AES-256-CBC before Drive upload
- **Drafts**: Two-step flow (create → approve → send) prevents accidental sends

## Urgency Detection

Emails are classified as urgent based on:
- **Keywords** in subject/body: configured in `config.json` → `urgentKeywords`
- **Senders**: configured in `config.json` → `urgentSenders`

Extend these lists for your workflow.

## Architecture

```
auth.js      → OAuth2 flow, token management, shared getAuthClient()
gmail.js     → Gmail API + People API (contacts)
calendar.js  → Calendar API
drive.js     → Drive API + encryption
docs.js      → Docs/Sheets/Slides/Drive permissions
config.json  → Scopes, 1Password refs, urgency rules
tokens/      → Stored OAuth tokens (gitignored)
```
