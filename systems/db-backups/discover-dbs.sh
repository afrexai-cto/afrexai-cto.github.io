#!/usr/bin/env bash
# discover-dbs.sh - Auto-discover all SQLite databases under SCAN_ROOT
# Usage: ./discover-dbs.sh [scan_root]
# Outputs one absolute path per line.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/config.sh"

ROOT="${1:-$SCAN_ROOT}"

# Build find exclusion args from colon-separated list
EXCLUDE_ARGS=""
IFS=':'
for dir in $SCAN_EXCLUDE; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS -name $dir -prune -o"
done
unset IFS

# Find files, check each with `file` command for SQLite signature
# Also match common extensions as fast path
eval find "\"$ROOT\"" $EXCLUDE_ARGS -type f \\\( -name "'*.db'" -o -name "'*.sqlite'" -o -name "'*.sqlite3'" -o -name "'*.db3'" \\\) -print 2>/dev/null | while IFS= read -r f; do
    if file "$f" 2>/dev/null | grep -qi 'sqlite'; then
        printf '%s\n' "$f"
    fi
done

# Also check any file with SQLite magic bytes that doesn't have a standard extension
eval find "\"$ROOT\"" $EXCLUDE_ARGS -type f -print 2>/dev/null | while IFS= read -r f; do
    case "$f" in
        *.db|*.sqlite|*.sqlite3|*.db3) continue ;;
    esac
    # Check first 16 bytes for SQLite header
    if head -c 16 "$f" 2>/dev/null | grep -q 'SQLite format 3'; then
        printf '%s\n' "$f"
    fi
done
