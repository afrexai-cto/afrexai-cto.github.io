# AfrexAI Demo Framework CLI

Orchestrates the demo system — activity generation, deliverable management, validation, and deployment.

## Quick Start

```bash
cd demo/framework
node cli.js status          # See current state
node cli.js generate        # Generate new activity
node cli.js validate        # Check everything is healthy
```

## Commands

### `status`
Shows companies, agents, deliverable counts, activity freshness.
```bash
node cli.js status
```

### `generate`
Runs the activity generator (wraps `agents/lib/generate.js`).
```bash
node cli.js generate                        # All companies
node cli.js generate --company meridian-health  # Specific company
```

### `deliverable`
Manage deliverables — list, create prompts, or add pre-generated content.

```bash
# List all deliverables
node cli.js deliverable --list

# Create a pending prompt for an agent to process
node cli.js deliverable --company pacific-legal --task contract-review

# Add a pre-generated deliverable
node cli.js deliverable --add --company meridian-health --agent patient-coordinator --type scheduling --file /path/to/content.md
```

### `push`
Commit and push demo data to GitHub Pages.
```bash
node cli.js push
```

### `validate`
Self-validation: checks artifact paths, JSON validity, frontmatter, orphaned files.
```bash
node cli.js validate
```

### `company`
Scaffold a new demo company with sample data, task definitions, and activity.json entry.
```bash
node cli.js company --add --id "acme-corp" --name "Acme Corporation" --vertical "saas" --tier "growth"
```

## Architecture

The CLI orchestrates existing scripts rather than replacing them:
- `demo/agents/lib/generate.js` — activity simulation engine
- `demo/agents/real-agent-runner.js` — real agent prompt/deliverable pipeline
- `demo/agents/tasks/*.json` — task definitions per company
- `demo/data/activity.json` — central state file
- `demo/data/deliverables/` — generated artifact storage
