# Health Monitoring System

Workspace health checks with cooldown-based scheduling. Silence means healthy.

## Usage

```bash
node monitor.js          # Run checks due based on cooldowns
node monitor.js --all    # Force all checks
node monitor.js --daily  # Force daily checks only
node monitor.js --json   # Include JSON output
```

## Checks

| Frequency | Check | Alert Condition |
|-----------|-------|----------------|
| Daily | Data freshness | Social media data >3 days old |
| Daily | Repo size | .git >500MB |
| Daily | Error logs | Recurring error patterns (≥3 occurrences) |
| Daily | Git backup | Remote unreachable or uncommitted changes |
| Weekly | Gateway binding | Binds to 0.0.0.0 instead of localhost |
| Weekly | Auth enabled | Auth disabled in gateway config |
| Monthly | Memory scan | Prompt injection patterns in memory files |

## Exit Codes

- `0` — healthy
- `1` — warnings
- `2` — critical alerts

## Files

- `config.json` — thresholds, paths, suspicious patterns
- `state.json` — last-run timestamps, latest alerts
- `monitor.js` — orchestrator with cooldown logic
- `checks/` — daily, weekly, monthly check modules
