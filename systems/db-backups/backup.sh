#!/usr/bin/env bash
# backup.sh - Discover SQLite DBs, bundle into encrypted tar archive.
# Usage: ./backup.sh
# Set BACKUP_ENC_PASS env var for the encryption password.

set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/config.sh"

TIMESTAMP="$(date +"$TS_FMT")"
BACKUP_NAME="backup-${TIMESTAMP}"
STAGING_DIR="$(mktemp -d)"
MANIFEST="$STAGING_DIR/manifest.txt"

alert_failure() {
    local msg="$1"
    local ts
    ts="$(date '+%Y-%m-%d %H:%M:%S')"
    printf '## ⚠️ Backup Failure\n\n- **Time:** %s\n- **Error:** %s\n' "$ts" "$msg" >> "$ALERT_FILE"
    echo "ALERT: $msg (written to $ALERT_FILE)"
}

cleanup() {
    rm -rf "$STAGING_DIR"
}
trap cleanup EXIT

# Ensure backup dir exists
mkdir -p "$BACKUP_DIR"

# Discover databases
echo "==> Discovering SQLite databases under $SCAN_ROOT ..."
DB_LIST=$("$SCRIPT_DIR/discover-dbs.sh" 2>&1) || true

if [ -z "$DB_LIST" ]; then
    alert_failure "No SQLite databases found under $SCAN_ROOT"
    exit 1
fi

DB_COUNT=$(echo "$DB_LIST" | wc -l | tr -d ' ')
echo "    Found $DB_COUNT database(s)."

# Copy databases to staging using sqlite3 .backup for consistency
COPY_COUNT=0
echo "$DB_LIST" | while IFS= read -r dbpath; do
    # Preserve relative path structure
    REL="${dbpath#$SCAN_ROOT/}"
    DEST="$STAGING_DIR/databases/$REL"
    mkdir -p "$(dirname "$DEST")"

    # Use sqlite3 .backup if available, else plain copy
    if command -v sqlite3 >/dev/null 2>&1; then
        sqlite3 "$dbpath" ".backup '$DEST'" 2>/dev/null || cp "$dbpath" "$DEST"
    else
        cp "$dbpath" "$DEST"
    fi
    echo "$REL" >> "$MANIFEST"
done

if [ ! -f "$MANIFEST" ]; then
    alert_failure "Failed to copy any databases to staging"
    exit 1
fi

echo "==> Creating encrypted archive ..."
ARCHIVE="$BACKUP_DIR/${BACKUP_NAME}.tar.enc"

# Create tar then encrypt with openssl
tar -C "$STAGING_DIR" -cf - databases manifest.txt 2>/dev/null | \
    openssl enc -"$BACKUP_CIPHER" -salt -pbkdf2 -pass "pass:${BACKUP_ENC_PASS}" -out "$ARCHIVE"

if [ $? -ne 0 ] || [ ! -f "$ARCHIVE" ]; then
    alert_failure "Failed to create encrypted archive"
    exit 1
fi

# Save manifest copy alongside archive
cp "$MANIFEST" "$BACKUP_DIR/${BACKUP_NAME}.manifest"

SIZE=$(ls -lh "$ARCHIVE" | awk '{print $5}')
echo "==> Backup complete: $ARCHIVE ($SIZE)"
echo "    Manifest: $BACKUP_DIR/${BACKUP_NAME}.manifest"

# Rotate old backups
echo "==> Rotating old backups ..."
"$SCRIPT_DIR/rotate.sh"

# Google Drive upload stub
if [ "$GDRIVE_UPLOAD" = "true" ]; then
    echo "==> Google Drive upload enabled (stub)"
    # TODO: Implement with rclone or gdrive CLI
    # Example: rclone copy "$ARCHIVE" "gdrive:$GDRIVE_DEST/"
    echo "    STUB: Would upload $ARCHIVE to $GDRIVE_DEST"
fi

echo "==> Done."
