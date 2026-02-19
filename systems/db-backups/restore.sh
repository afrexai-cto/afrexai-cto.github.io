#!/usr/bin/env bash
# restore.sh - Restore databases from an encrypted backup archive.
# Usage: ./restore.sh <backup_file.tar.enc> [restore_dir]
#   backup_file: Path to the .tar.enc file
#   restore_dir: Where to restore (default: ./restored-<timestamp>)
# Set BACKUP_ENC_PASS env var for the decryption password.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/config.sh"

if [ $# -lt 1 ]; then
    echo "Usage: $0 <backup_file.tar.enc> [restore_dir]"
    echo ""
    echo "Available backups:"
    ls -1t "$BACKUP_DIR"/backup-*.tar.enc 2>/dev/null | while IFS= read -r f; do
        SIZE=$(ls -lh "$f" | awk '{print $5}')
        echo "  $(basename "$f")  ($SIZE)"
    done
    exit 1
fi

ARCHIVE="$1"
if [ ! -f "$ARCHIVE" ]; then
    # Try relative to backup dir
    if [ -f "$BACKUP_DIR/$ARCHIVE" ]; then
        ARCHIVE="$BACKUP_DIR/$ARCHIVE"
    else
        echo "Error: Archive not found: $ARCHIVE"
        exit 1
    fi
fi

TIMESTAMP="$(date +"$TS_FMT")"
RESTORE_DIR="${2:-$SCRIPT_DIR/restored-${TIMESTAMP}}"

echo "==> Decrypting and extracting: $(basename "$ARCHIVE")"
echo "    Restore target: $RESTORE_DIR"

mkdir -p "$RESTORE_DIR"

openssl enc -d -"$BACKUP_CIPHER" -pbkdf2 -pass "pass:${BACKUP_ENC_PASS}" -in "$ARCHIVE" | \
    tar -C "$RESTORE_DIR" -xf -

if [ $? -ne 0 ]; then
    echo "Error: Decryption or extraction failed."
    exit 1
fi

echo ""
echo "==> Restored databases:"
if [ -f "$RESTORE_DIR/manifest.txt" ]; then
    while IFS= read -r rel; do
        FULL="$RESTORE_DIR/databases/$rel"
        if [ -f "$FULL" ]; then
            # Verify it's a valid SQLite DB
            if command -v sqlite3 >/dev/null 2>&1; then
                if sqlite3 "$FULL" "PRAGMA integrity_check;" 2>/dev/null | grep -q "ok"; then
                    STATUS="✅ valid"
                else
                    STATUS="⚠️  integrity check failed"
                fi
            else
                STATUS="(sqlite3 not available for verification)"
            fi
            echo "  $rel — $STATUS"
        else
            echo "  $rel — ❌ missing"
        fi
    done < "$RESTORE_DIR/manifest.txt"
else
    echo "  (no manifest found, listing files)"
    find "$RESTORE_DIR" -type f | sed "s|$RESTORE_DIR/||"
fi

echo ""
echo "==> Restore complete: $RESTORE_DIR"
echo ""
echo "To replace original databases, copy from:"
echo "  $RESTORE_DIR/databases/<relative_path>"
echo "back to their original locations under $SCAN_ROOT"
