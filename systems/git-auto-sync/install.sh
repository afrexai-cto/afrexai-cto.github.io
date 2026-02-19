#!/usr/bin/env bash
# Install git-auto-sync: sets up pre-commit hook and optional launchd/cron.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd)"
source "${SCRIPT_DIR}/config.sh"

echo "=== Git Auto-Sync Installer ==="
echo "Repo: $SYNC_REPO_PATH"
echo "Remote: $SYNC_REMOTE"
echo ""

# --- Make scripts executable ---
chmod +x "${SCRIPT_DIR}/sync.sh"
chmod +x "${SCRIPT_DIR}/pre-commit-hook.sh"

# --- Install pre-commit hook ---
HOOK_DIR="${SYNC_REPO_PATH}/.git/hooks"
if [ -d "$HOOK_DIR" ]; then
  HOOK_PATH="${HOOK_DIR}/pre-commit"
  if [ -f "$HOOK_PATH" ]; then
    echo "WARNING: pre-commit hook already exists at $HOOK_PATH"
    echo "  Backing up to ${HOOK_PATH}.bak"
    cp "$HOOK_PATH" "${HOOK_PATH}.bak"
  fi
  cat > "$HOOK_PATH" << EOF
#!/usr/bin/env bash
# Installed by git-auto-sync
export GIT_SYNC_CONFIG="${SCRIPT_DIR}/config.sh"
exec "${SCRIPT_DIR}/pre-commit-hook.sh"
EOF
  chmod +x "$HOOK_PATH"
  echo "✓ Pre-commit hook installed at $HOOK_PATH"
else
  echo "WARNING: ${HOOK_DIR} not found. Is this a git repo?"
fi

# --- Offer scheduling ---
echo ""
echo "Schedule hourly sync? Options:"
echo "  1) macOS launchd (recommended for macOS)"
echo "  2) cron"
echo "  3) Skip (run manually with: ${SCRIPT_DIR}/sync.sh)"
echo ""

if [ "${1:-}" = "--launchd" ]; then
  CHOICE=1
elif [ "${1:-}" = "--cron" ]; then
  CHOICE=2
elif [ "${1:-}" = "--skip" ]; then
  CHOICE=3
else
  read -p "Choice [1/2/3]: " CHOICE 2>/dev/null || CHOICE=3
fi

case "$CHOICE" in
  1)
    PLIST_NAME="com.openclaw.git-auto-sync"
    PLIST_PATH="${HOME}/Library/LaunchAgents/${PLIST_NAME}.plist"
    mkdir -p "${HOME}/Library/LaunchAgents"
    cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${SCRIPT_DIR}/sync.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>3600</integer>
    <key>StandardOutPath</key>
    <string>${SCRIPT_DIR}/sync.log</string>
    <key>StandardErrorPath</key>
    <string>${SCRIPT_DIR}/sync.log</string>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
EOF
    launchctl unload "$PLIST_PATH" 2>/dev/null || true
    launchctl load "$PLIST_PATH"
    echo "✓ launchd agent installed and loaded: $PLIST_PATH"
    ;;
  2)
    CRON_LINE="0 * * * * /bin/bash ${SCRIPT_DIR}/sync.sh >> ${SCRIPT_DIR}/sync.log 2>&1"
    (crontab -l 2>/dev/null | grep -v "git-auto-sync/sync.sh"; echo "$CRON_LINE") | crontab -
    echo "✓ Cron job installed (hourly)."
    ;;
  *)
    echo "Skipped scheduling. Run manually: ${SCRIPT_DIR}/sync.sh"
    ;;
esac

echo ""
echo "=== Installation complete ==="
