# AaaS Customer Directories

Each customer gets a directory named `<customer-slug>/` containing all configuration and operational files for their OpenClaw instance.

## Directory Structure

```
customers/
├── README.md                          ← You are here
├── sean-ford-skilled-real-estate/     ← Customer directory
│   ├── SOUL.md                        # Agent persona & instructions
│   ├── AGENTS.md                      # Workspace rules
│   ├── USER.md                        # Customer profile & preferences
│   ├── TOOLS.md                       # Integration-specific notes
│   ├── op.env                         # 1Password secret references
│   ├── integrations.md                # Active integrations & config
│   ├── kickoff-notes.md               # Notes from kickoff call
│   ├── burn-in-report.md              # 48-hour burn-in results
│   ├── agents/                        # Multi-agent configs (swarm tier)
│   │   ├── exec-assistant/SOUL.md
│   │   ├── outbound-sales/SOUL.md
│   │   └── ...
│   ├── feedback/                      # Check-in feedback
│   │   ├── week-1.md
│   │   └── ...
│   ├── reports/                       # Monthly performance reports
│   │   ├── 2026-03.md
│   │   └── ...
│   └── quarterly/                     # Quarterly review docs
│       ├── Q1-review.md
│       └── ...
└── <next-customer>/
```

## Naming Convention

Use kebab-case: `firstname-lastname-company`

Examples:
- `sean-ford-skilled-real-estate`
- `jane-doe-acme-consulting`
- `john-smith-apex-financial`

## Deployment

Files in these directories are copied to the customer's VPS at:
`/home/openclaw/.openclaw/workspace-main/`

Only workspace files (SOUL.md, AGENTS.md, etc.) are deployed. Operational files (kickoff-notes, reports, feedback) stay local.

## Security

- **Never store plaintext secrets** in customer directories
- Use `op.env` with 1Password references only
- Customer directories may contain PII — do not commit to public repos
