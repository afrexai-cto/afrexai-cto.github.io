# 🏛️ Security Council

AI-powered security review system that analyzes your codebase from four adversarial perspectives.

## Perspectives

| Perspective | Role | Focus |
|---|---|---|
| ⚔️ Offensive | Red-team attacker | Exploitable vulns, injection, auth bypass, secret exposure |
| 🛡️ Defensive | Blue-team defender | Protection gaps, missing validation, weak patterns |
| 🔒 Data Privacy | Privacy auditor | PII exposure, encryption gaps, compliance issues |
| 🎯 Operational Realism | Pragmatic engineer | Real risks vs security theater |

## Quick Start

```bash
npm install
node scanner.js          # Scan codebase
node analyzer.js         # AI analysis (requires 1Password CLI + Anthropic key)
node report-generator.js # Generate markdown report
node deep-dive.js 3      # Deep dive on finding #3
```

## Full Pipeline

```bash
npm run full-review      # scan → analyze → report
```

## Files

| File | Purpose |
|---|---|
| `scanner.js` | Collects files from codebase |
| `analyzer.js` | Sends to Anthropic API for 4-perspective analysis |
| `report-generator.js` | Generates structured markdown report |
| `deep-dive.js` | Detailed analysis of any finding |
| `config.json` | Scan paths, model config, perspective prompts |
| `schema.sql` | SQLite schema for findings history |

## Requirements

- Node.js 18+
- 1Password CLI (`op`) authenticated
- Anthropic API key at `op://AfrexAI/Anthropic/api_key`

## Nightly Automation

Add to cron or OpenClaw scheduler:
```bash
cd /Users/openclaw/.openclaw/workspace-main/systems/security-council && npm run full-review
```

Critical findings are flagged in console output for alerting integration.
