# 🏥 Platform Health Council

Automated platform health analysis across 9 areas with AI-powered recommendations and SQLite trend tracking.

## Areas Analyzed

1. **Cron Job Health** - Are automated jobs and systems active?
2. **Code Quality** - Technical debt indicators (TODOs, HACKs, long files)
3. **Test Coverage** - Test file ratio and coverage gaps
4. **Prompt Quality** - AI prompt structure and completeness
5. **Dependencies** - Package health, lockfiles, floating versions
6. **Storage** - Large files, database sizes
7. **Skill Integrity** - Skill completeness (SKILL.md, entrypoints)
8. **Config Consistency** - Valid configs, secret management
9. **Data Integrity** - CRM/contact database health, backups

## Usage

```bash
npm install
npm run check    # Run full health analysis
npm run report   # View latest report as markdown
node report.js trends  # View score trends over time
```

## Architecture

- `health-check.js` - Main runner, orchestrates analyzers, stores results
- `analyzers/` - One module per health area
- `report.js` - Report generator (markdown output)
- `schema.sql` - SQLite schema for trend tracking
- `health.db` - SQLite database (created on first run)
- `last-run.json` - Latest run results

## AI Recommendations

Uses Anthropic API (via 1Password for key management) to generate prioritized, actionable recommendations based on analysis results. Falls back to rule-based recommendations if API is unavailable.

## Scoring

- **80-100**: ✅ Healthy
- **50-79**: ⚠️ Warning
- **0-49**: 🔴 Critical
