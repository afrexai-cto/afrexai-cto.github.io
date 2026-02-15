#!/usr/bin/env bash
# backup-restore.sh — Customer data management for AfrexAI Hosted Agents
# Bash 3.2 compatible
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="${AFREX_DATA_DIR:-$SCRIPT_DIR/data}"
CUSTOMERS_DIR="$DATA_DIR/customers"
GLOBAL_BACKUPS="$DATA_DIR/backups"
RETENTION_DAYS="${AFREX_RETENTION_DAYS:-90}"

read_json_field() {
    local file="$1" field="$2"
    sed -n "s/.*\"${field}\"[[:space:]]*:[[:space:]]*\"\{0,1\}\([^,\"}]*\)\"\{0,1\}.*/\1/p" "$file" | head -1
}

usage() {
    cat <<EOF
Usage: $0 <command> [options]

Commands:
  backup          Backup customer data (or all customers)
  restore         Restore customer from backup
  export          Export customer data (offboarding/compliance)
  retention       Enforce retention policy (delete old backups)
  list            List available backups

Options:
  --customer <id>     Target customer (omit for all)
  --backup-id <id>    Backup ID for restore
  --output <path>     Export output path
  --retention <days>  Override retention period (default: $RETENTION_DAYS days)
  --dry-run           Show what would happen
  -h, --help          Show this help

Examples:
  $0 backup --customer cust-acme-123
  $0 backup                              # backup all
  $0 restore --customer cust-acme-123 --backup-id 20260215-120000
  $0 export --customer cust-acme-123 --output /tmp/acme-export
  $0 retention --dry-run
EOF
    exit "${1:-0}"
}

# --- Backup ---
do_backup() {
    local cid="$1"
    local cdir="$CUSTOMERS_DIR/$cid"
    [ -d "$cdir" ] || { echo "Error: Customer $cid not found." >&2; return 1; }

    local ts
    ts="$(date -u +%Y%m%d-%H%M%S)"
    local backup_dir="$cdir/backups/$ts"
    mkdir -p "$backup_dir"

    echo "  ▸ Backing up $cid..."

    # Backup config
    cp -R "$cdir/config" "$backup_dir/config" 2>/dev/null || true

    # Backup all agent data (memories, configs, logs)
    if [ -d "$cdir/agents" ]; then
        mkdir -p "$backup_dir/agents"
        for adir in "$cdir/agents"/*/; do
            [ -d "$adir" ] || continue
            local aname
            aname="$(basename "$adir")"
            cp -R "$adir" "$backup_dir/agents/$aname" 2>/dev/null || true
        done
    fi

    # Backup monitoring
    cp -R "$cdir/monitoring" "$backup_dir/monitoring" 2>/dev/null || true

    # Backup customer data dir
    if [ -d "$cdir/data" ]; then
        cp -R "$cdir/data" "$backup_dir/data" 2>/dev/null || true
    fi

    # Create manifest
    local size
    size="$(du -sk "$backup_dir" 2>/dev/null | awk '{print $1}')"
    local agent_count
    agent_count="$(ls -1 "$backup_dir/agents" 2>/dev/null | wc -l | tr -d ' ')"
    cat > "$backup_dir/backup-manifest.json" <<BMAN
{
  "backup_id": "$ts",
  "customer_id": "$cid",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "size_kb": $size,
  "agents_backed_up": $agent_count,
  "type": "full"
}
BMAN

    echo "  ✓ $cid backed up → $ts (${size}KB, $agent_count agents)"
}

cmd_backup() {
    local customer="$1" dry_run="$2"

    echo "=============================================="
    echo "  AfrexAI — Backup"
    echo "=============================================="
    echo ""

    if [ -n "$customer" ]; then
        if [ "$dry_run" -eq 1 ]; then
            echo "[DRY RUN] Would backup: $customer"
            return
        fi
        do_backup "$customer"
    else
        local count=0
        for cdir in "$CUSTOMERS_DIR"/*/; do
            [ -f "$cdir/config/manifest.json" ] || continue
            local cid
            cid="$(basename "$cdir")"
            if [ "$dry_run" -eq 1 ]; then
                echo "[DRY RUN] Would backup: $cid"
            else
                do_backup "$cid"
            fi
            count=$((count + 1))
        done
        echo ""
        echo "  ✅ $count customer(s) backed up."
    fi
}

# --- Restore ---
cmd_restore() {
    local customer="$1" backup_id="$2"

    [ -n "$customer" ] || { echo "Error: --customer required for restore." >&2; exit 1; }
    [ -n "$backup_id" ] || { echo "Error: --backup-id required for restore." >&2; exit 1; }

    local cdir="$CUSTOMERS_DIR/$customer"
    local backup_dir="$cdir/backups/$backup_id"

    [ -d "$backup_dir" ] || { echo "Error: Backup $backup_id not found for $customer." >&2; exit 1; }

    echo "=============================================="
    echo "  AfrexAI — Restore"
    echo "=============================================="
    echo ""
    echo "  Customer: $customer"
    echo "  Backup:   $backup_id"

    if [ -f "$backup_dir/backup-manifest.json" ]; then
        echo "  Size:     $(read_json_field "$backup_dir/backup-manifest.json" "size_kb")KB"
        echo "  Agents:   $(read_json_field "$backup_dir/backup-manifest.json" "agents_backed_up")"
    fi
    echo ""

    # Restore config
    if [ -d "$backup_dir/config" ]; then
        echo "  ▸ Restoring config..."
        cp -R "$backup_dir/config/"* "$cdir/config/" 2>/dev/null || true
    fi

    # Restore agents
    if [ -d "$backup_dir/agents" ]; then
        echo "  ▸ Restoring agents..."
        for adir in "$backup_dir/agents"/*/; do
            [ -d "$adir" ] || continue
            local aname
            aname="$(basename "$adir")"
            mkdir -p "$cdir/agents/$aname"
            cp -R "$adir/"* "$cdir/agents/$aname/" 2>/dev/null || true
            echo "    ✓ $aname restored"
        done
    fi

    # Restore monitoring
    if [ -d "$backup_dir/monitoring" ]; then
        echo "  ▸ Restoring monitoring..."
        cp -R "$backup_dir/monitoring/"* "$cdir/monitoring/" 2>/dev/null || true
    fi

    # Restore data
    if [ -d "$backup_dir/data" ]; then
        echo "  ▸ Restoring data..."
        cp -R "$backup_dir/data/"* "$cdir/data/" 2>/dev/null || true
    fi

    echo ""
    echo "  ✅ Restore complete from backup $backup_id"
}

# --- Export ---
cmd_export() {
    local customer="$1" output="$2"

    [ -n "$customer" ] || { echo "Error: --customer required for export." >&2; exit 1; }

    local cdir="$CUSTOMERS_DIR/$customer"
    [ -d "$cdir" ] || { echo "Error: Customer $customer not found." >&2; exit 1; }

    local export_dir="${output:-$GLOBAL_BACKUPS/exports/${customer}-$(date -u +%Y%m%d-%H%M%S)}"
    mkdir -p "$export_dir"

    echo "=============================================="
    echo "  AfrexAI — Data Export"
    echo "=============================================="
    echo ""
    echo "  Customer:  $customer"
    echo "  Output:    $export_dir"
    echo ""

    # Copy everything
    echo "  ▸ Exporting config..."
    cp -R "$cdir/config" "$export_dir/config" 2>/dev/null || true

    echo "  ▸ Exporting agent data..."
    if [ -d "$cdir/agents" ]; then
        cp -R "$cdir/agents" "$export_dir/agents" 2>/dev/null || true
    fi

    echo "  ▸ Exporting monitoring data..."
    cp -R "$cdir/monitoring" "$export_dir/monitoring" 2>/dev/null || true

    echo "  ▸ Exporting logs..."
    cp -R "$cdir/logs" "$export_dir/logs" 2>/dev/null || true

    # Create export manifest
    local size
    size="$(du -sk "$export_dir" 2>/dev/null | awk '{print $1}')"
    cat > "$export_dir/export-manifest.json" <<EMAN
{
  "customer_id": "$customer",
  "exported_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "size_kb": $size,
  "reason": "customer_export",
  "includes": ["config", "agents", "monitoring", "logs"]
}
EMAN

    echo ""
    echo "  ✅ Export complete: $export_dir (${size}KB)"
    echo "  📋 Manifest: $export_dir/export-manifest.json"
}

# --- Retention ---
cmd_retention() {
    local days="$1" dry_run="$2"

    echo "=============================================="
    echo "  AfrexAI — Retention Policy Enforcement"
    echo "=============================================="
    echo ""
    echo "  Policy: Delete backups older than $days days"
    echo ""

    local deleted=0 freed=0

    for cdir in "$CUSTOMERS_DIR"/*/; do
        [ -d "$cdir/backups" ] || continue
        local cid
        cid="$(basename "$cdir")"

        for bdir in "$cdir/backups"/*/; do
            [ -d "$bdir" ] || continue
            [ -f "$bdir/backup-manifest.json" ] || continue

            local created
            created="$(read_json_field "$bdir/backup-manifest.json" "created_at")"
            [ -n "$created" ] || continue

            # Parse date and check age
            local created_ts now_ts age_days
            # macOS date vs GNU date
            if date -j -f "%Y-%m-%dT%H:%M:%SZ" "$created" +%s >/dev/null 2>&1; then
                created_ts="$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$created" +%s 2>/dev/null)"
            else
                created_ts="$(date -d "$created" +%s 2>/dev/null || echo 0)"
            fi
            now_ts="$(date +%s)"
            if [ "$created_ts" -eq 0 ]; then continue; fi
            age_days=$(( (now_ts - created_ts) / 86400 ))

            if [ "$age_days" -gt "$days" ]; then
                local bsize
                bsize="$(du -sk "$bdir" 2>/dev/null | awk '{print $1}')"
                local bid
                bid="$(basename "$bdir")"
                if [ "$dry_run" -eq 1 ]; then
                    echo "  [DRY RUN] Would delete: $cid/$bid (${age_days}d old, ${bsize}KB)"
                else
                    rm -rf "$bdir"
                    echo "  🗑  Deleted: $cid/$bid (${age_days}d old, ${bsize}KB)"
                fi
                deleted=$((deleted + 1))
                freed=$((freed + bsize))
            fi
        done
    done

    echo ""
    if [ "$deleted" -eq 0 ]; then
        echo "  No backups exceed retention period. All clean. ✅"
    else
        local prefix=""
        if [ "$dry_run" -eq 1 ]; then prefix="[DRY RUN] Would delete"; else prefix="Deleted"; fi
        echo "  $prefix $deleted backup(s), freed ${freed}KB"
    fi
}

# --- List ---
cmd_list() {
    local customer="$1"

    echo "=============================================="
    echo "  AfrexAI — Available Backups"
    echo "=============================================="
    echo ""

    local found=0
    for cdir in "$CUSTOMERS_DIR"/*/; do
        [ -d "$cdir/backups" ] || continue
        local cid
        cid="$(basename "$cdir")"
        if [ -n "$customer" ] && [ "$cid" != "$customer" ]; then continue; fi

        local has_backups=0
        for bdir in "$cdir/backups"/*/; do
            [ -f "$bdir/backup-manifest.json" ] || continue
            if [ "$has_backups" -eq 0 ]; then
                echo "  $cid:"
                has_backups=1
            fi
            local bid created size
            bid="$(basename "$bdir")"
            created="$(read_json_field "$bdir/backup-manifest.json" "created_at")"
            size="$(read_json_field "$bdir/backup-manifest.json" "size_kb")"
            echo "    • $bid  (${created}, ${size}KB)"
            found=$((found + 1))
        done
    done

    if [ "$found" -eq 0 ]; then
        echo "  No backups found."
    fi
}

# --- Parse args ---
COMMAND="" CUSTOMER="" BACKUP_ID="" OUTPUT="" RET_DAYS="$RETENTION_DAYS" DRY_RUN=0

while [ $# -gt 0 ]; do
    case "$1" in
        backup|restore|export|retention|list) COMMAND="$1"; shift ;;
        --customer)   CUSTOMER="$2"; shift 2 ;;
        --backup-id)  BACKUP_ID="$2"; shift 2 ;;
        --output)     OUTPUT="$2"; shift 2 ;;
        --retention)  RET_DAYS="$2"; shift 2 ;;
        --dry-run)    DRY_RUN=1; shift ;;
        -h|--help)    usage 0 ;;
        *)            echo "Unknown: $1" >&2; usage 1 ;;
    esac
done

[ -n "$COMMAND" ] || usage 1

case "$COMMAND" in
    backup)    cmd_backup "$CUSTOMER" "$DRY_RUN" ;;
    restore)   cmd_restore "$CUSTOMER" "$BACKUP_ID" ;;
    export)    cmd_export "$CUSTOMER" "$OUTPUT" ;;
    retention) cmd_retention "$RET_DAYS" "$DRY_RUN" ;;
    list)      cmd_list "$CUSTOMER" ;;
esac
