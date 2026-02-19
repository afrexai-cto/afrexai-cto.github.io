#!/usr/bin/env bash
# rotate.sh - Keep only the last N backups, delete the rest.
# Usage: ./rotate.sh [count]

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/config.sh"

KEEP="${1:-$BACKUP_RETAIN}"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "No backup directory found: $BACKUP_DIR"
    exit 0
fi

# List backup files sorted oldest first
BACKUPS=$(ls -1t "$BACKUP_DIR"/backup-*.tar.enc 2>/dev/null || true)
COUNT=$(echo "$BACKUPS" | grep -c . 2>/dev/null || echo 0)

if [ "$COUNT" -le "$KEEP" ]; then
    echo "rotate: $COUNT backups found, keeping $KEEP — nothing to remove."
    exit 0
fi

REMOVE=$((COUNT - KEEP))
echo "rotate: $COUNT backups found, keeping $KEEP, removing $REMOVE."

echo "$BACKUPS" | tail -n "$REMOVE" | while IFS= read -r f; do
    echo "  removing: $(basename "$f")"
    rm -f "$f"
    # Also remove manifest if present
    rm -f "${f%.tar.enc}.manifest"
done
