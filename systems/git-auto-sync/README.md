# Git Auto-Sync

Hourly auto-commit and push for your workspace. Designed for macOS (bash 3.2 compatible).

## Features

- **Hourly auto-commit** — stages all changes, commits with timestamp, pushes to remote
- **Conflict detection** — diverged branches trigger notification instead of force-push
- **Timestamp tags** — every sync tagged `sync-YYYYMMDD-HHMMSS`
- **Sensitive data blocking** — pre-commit hook scans for API keys, `.env` files, private keys, session tokens, cookies
- **Configurable** — repo path, remote, branch, notification command all in `config.sh`

## Quick Start

```bash
# 1. Edit config
vi systems/git-auto-sync/config.sh

# 2. Install (sets up hook + scheduling)
bash systems/git-auto-sync/install.sh

# 3. Or run manually
bash systems/git-auto-sync/sync.sh
```

## Files

| File | Purpose |
|------|---------|
| `config.sh` | All settings (repo path, remote, patterns) |
| `sync.sh` | Main sync script (commit, tag, push) |
| `pre-commit-hook.sh` | Blocks sensitive data from commits |
| `install.sh` | Installs hook + schedules hourly runs |

## Scheduling Options

- **macOS launchd** (recommended): `install.sh --launchd`
- **cron**: `install.sh --cron`
- **Manual/agent**: call `sync.sh` directly

## Conflict Handling

When local and remote diverge, sync **does not force-push**. It notifies and exits with code 1. Resolve manually:

```bash
cd /path/to/repo
git fetch origin
git merge origin/main  # resolve conflicts
git push
```

## Sensitive Data Patterns

The pre-commit hook blocks:
- AWS keys (`AKIA...`)
- Private keys (PEM)
- OpenAI/Stripe secret keys (`sk-...`)
- GitHub PATs (`ghp_...`)
- Session tokens, cookies, Bearer tokens
- Files: `.env`, `*.pem`, `*.key`, `credentials.json`, etc.

Bypass (not recommended): `git commit --no-verify`
