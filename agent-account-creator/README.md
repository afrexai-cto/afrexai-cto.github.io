# Agent Account Creator — AfrexAI

Automated Google Workspace account creation for AfrexAI's 9 AI agent email accounts.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up Google Cloud (see setup-guide.md for detailed steps)
#    - Enable Admin SDK API
#    - Create service account with domain-wide delegation
#    - Download credentials.json to this directory

# 3. Update config.json
#    - Set adminEmail to your Google Workspace super admin email
#    - Set domain if different from afrexai.com

# 4. Test authentication
node test-auth.js

# 5. Create all 9 agent accounts
node create-agents.js --all

# Or create a single account
node create-agent.js --email ea@afrexai.com --name "Executive Assistant"
```

## Agent Accounts

| Email | Role |
|-------|------|
| ea@afrexai.com | Executive Assistant |
| marketing@afrexai.com | Marketing Analyst |
| content@afrexai.com | Content Writer |
| sales@afrexai.com | Outbound Sales |
| bookkeeper@afrexai.com | Bookkeeper |
| coo@afrexai.com | COO |
| strategist@afrexai.com | Strategist |
| consultant@afrexai.com | Consultant |
| pm@afrexai.com | Project Manager |

## Commands

### Create a single agent
```bash
node create-agent.js --email ea@afrexai.com --name "Executive Assistant"
```

Options:
- `--email` (required) — Email address
- `--name` (required) — Display name / role
- `--password <pw>` — Set password (auto-generated if omitted)
- `--org-unit <path>` — Org unit (default: /Agents)
- `--dry-run` — Preview without creating

### Batch create all agents
```bash
node create-agents.js --all
node create-agents.js --all --dry-run  # preview first
```

### List existing users
```bash
node list-users.js
```

### Test authentication
```bash
node test-auth.js
```

## Setup Requirements

1. **Google Workspace** with admin access
2. **Google Cloud project** with Admin SDK API enabled
3. **Service account** with domain-wide delegation
4. **credentials.json** — service account key file in this directory

See **[setup-guide.md](setup-guide.md)** for complete step-by-step instructions.

## Security Notes

- `credentials.json` is gitignored — never commit it
- `.created-accounts.json` stores generated passwords locally — delete after saving them securely
- All accounts are created with `changePasswordAtNextLogin: true` by default
- Passwords are 24-character random strings with mixed case, numbers, and symbols

## Config

Edit `config.json` to customize:

```json
{
  "domain": "afrexai.com",
  "orgUnitPath": "/Agents",
  "adminEmail": "kalin@afrexai.com",
  "credentialsFile": "./credentials.json",
  "changePasswordAtNextLogin": true
}
```
