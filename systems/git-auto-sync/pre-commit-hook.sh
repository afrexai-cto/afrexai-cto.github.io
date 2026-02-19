#!/usr/bin/env bash
# Pre-commit hook: blocks commits containing sensitive data.
# Install via install.sh or copy to .git/hooks/pre-commit
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd)"
# When running as a git hook, config may be elsewhere; allow override.
CONFIG_PATH="${GIT_SYNC_CONFIG:-${SCRIPT_DIR}/config.sh}"
if [ -f "$CONFIG_PATH" ]; then
  source "$CONFIG_PATH"
fi

# Defaults if config not loaded
if [ -z "${SENSITIVE_PATTERNS+x}" ]; then
  SENSITIVE_PATTERNS=(
    'AKIA[0-9A-Z]{16}'
    '-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----'
    'sk-[a-zA-Z0-9]{20,}'
    'ghp_[a-zA-Z0-9]{36}'
    'session[_-]?(token|id|key)\s*[:=]'
    'cookie\s*[:=]'
    'Bearer [a-zA-Z0-9_./-]+'
  )
fi
if [ -z "${SENSITIVE_FILES+x}" ]; then
  SENSITIVE_FILES=('.env' '.env.*' '*.pem' '*.key' 'id_rsa' 'id_ed25519' 'credentials.json' 'cookies.txt' 'cookies.json' 'session.json')
fi

BLOCKED=0

# --- Check staged file names ---
staged_files="$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)"
if [ -n "$staged_files" ]; then
  for pattern in "${SENSITIVE_FILES[@]}"; do
    # Use bash pattern matching (compatible with bash 3.2)
    while IFS= read -r f; do
      basename_f="$(basename "$f")"
      case "$basename_f" in
        $pattern)
          echo "BLOCKED: Sensitive file staged: $f (matches '$pattern')"
          BLOCKED=1
          ;;
      esac
    done <<< "$staged_files"
  done

  # --- Check staged content for secret patterns ---
  diff_content="$(git diff --cached --diff-filter=ACM -U0 2>/dev/null || true)"
  if [ -n "$diff_content" ]; then
    for pat in "${SENSITIVE_PATTERNS[@]}"; do
      matches="$(echo "$diff_content" | grep -En "$pat" 2>/dev/null || true)"
      if [ -n "$matches" ]; then
        echo "BLOCKED: Sensitive content pattern detected: $pat"
        echo "$matches" | head -3
        BLOCKED=1
      fi
    done
  fi
fi

if [ "$BLOCKED" -eq 1 ]; then
  echo ""
  echo "=== COMMIT BLOCKED ==="
  echo "Sensitive data detected in staged changes."
  echo "Remove the flagged files/content and try again."
  echo "To bypass (NOT recommended): git commit --no-verify"
  exit 1
fi

exit 0
