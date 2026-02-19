#!/usr/bin/env bash
# Git Auto-Sync Configuration
# Edit these values to match your setup.

# Path to the git repository to sync
SYNC_REPO_PATH="${SYNC_REPO_PATH:-/Users/openclaw/.openclaw/workspace-main}"

# Git remote name
SYNC_REMOTE="${SYNC_REMOTE:-origin}"

# Branch to sync (empty = current branch)
SYNC_BRANCH="${SYNC_BRANCH:-}"

# Commit message prefix
SYNC_COMMIT_PREFIX="${SYNC_COMMIT_PREFIX:-[auto-sync]}"

# Tag prefix for timestamp tags
SYNC_TAG_PREFIX="${SYNC_TAG_PREFIX:-sync-}"

# Notification command (called with message as $1)
# Examples:
#   "osascript -e 'display notification \"$1\" with title \"Git Sync\"'"
#   "openclaw notify"
SYNC_NOTIFY_CMD="${SYNC_NOTIFY_CMD:-}"

# Patterns to scan for sensitive data (grep -E patterns)
SENSITIVE_PATTERNS=(
  'AKIA[0-9A-Z]{16}'                          # AWS Access Key
  '-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----' # Private keys
  'sk-[a-zA-Z0-9]{20,}'                        # OpenAI / Stripe secret keys
  'ghp_[a-zA-Z0-9]{36}'                        # GitHub PAT
  'session[_-]?(token|id|key)\s*[:=]'          # Session tokens
  'cookie\s*[:=]'                              # Cookies
  'Bearer [a-zA-Z0-9_./-]+'                    # Bearer tokens
  'op://[A-Za-z0-9/_-]+'                       # 1Password refs (warning only)
)

# File patterns that should never be committed
SENSITIVE_FILES=(
  '.env'
  '.env.*'
  '*.pem'
  '*.key'
  '*.p12'
  '*.pfx'
  'id_rsa'
  'id_ed25519'
  'credentials.json'
  'token.json'
  'cookies.txt'
  'cookies.json'
  'session.json'
)
