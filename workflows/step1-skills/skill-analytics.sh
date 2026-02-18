#!/bin/bash
# skill-analytics.sh — Track skill installs, revenue, ratings from ClawHub
# Bash 3.2 compatible
#
# Usage: ./skill-analytics.sh [--report weekly|daily] [--skill <slug>] [--trending] [--output <file>]

set -euo pipefail

# ── Defaults ──
REPORT_TYPE="weekly"
SKILL_FILTER=""
SHOW_TRENDING=false
OUTPUT_FILE=""
DATA_DIR="${ANALYTICS_DATA_DIR:-$(dirname "$0")/../../data/analytics}"
REPORT_DIR="${ANALYTICS_REPORT_DIR:-$(dirname "$0")/../../data/reports}"
TRENDING_THRESHOLD=20  # % growth to flag as trending

# ── Colours ──
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

log()  { printf "${GREEN}[✓]${NC} %s\n" "$1"; }
warn() { printf "${YELLOW}[!]${NC} %s\n" "$1"; }
err()  { printf "${RED}[✗]${NC} %s\n" "$1" >&2; }
info() { printf "${BLUE}[i]${NC} %s\n" "$1"; }

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Options:
  --report <type>     Report type: weekly (default), daily
  --skill <slug>      Filter to specific skill
  --trending          Show only trending skills
  --threshold <pct>   Trending threshold percentage (default: 20)
  --output <file>     Write report to file (default: stdout + data/reports/)
  -h, --help          Show this help
EOF
    exit 0
}

# ── Parse args ──
while [ $# -gt 0 ]; do
    case "$1" in
        --report)     REPORT_TYPE="$2"; shift 2 ;;
        --skill)      SKILL_FILTER="$2"; shift 2 ;;
        --trending)   SHOW_TRENDING=true; shift ;;
        --threshold)  TRENDING_THRESHOLD="$2"; shift 2 ;;
        --output)     OUTPUT_FILE="$2"; shift 2 ;;
        -h|--help)    usage ;;
        *)            err "Unknown option: $1"; usage ;;
    esac
done

mkdir -p "$DATA_DIR" "$REPORT_DIR"

# ── Fetch skill data from ClawHub ──
fetch_skill_stats() {
    local skill_slug="$1"
    local stats_file="$DATA_DIR/${skill_slug}.jsonl"

    # Try clawhub CLI for info
    if command -v clawhub >/dev/null 2>&1; then
        local raw
        raw=$(clawhub info "$skill_slug" 2>/dev/null || echo "")
        if [ -n "$raw" ]; then
            # Parse install count, rating from clawhub info output
            local installs rating
            installs=$(echo "$raw" | grep -i "install" | grep -oE '[0-9]+' | head -1 || echo "0")
            rating=$(echo "$raw" | grep -i "rating" | grep -oE '[0-9]+\.?[0-9]*' | head -1 || echo "0")
            [ -z "$installs" ] && installs=0
            [ -z "$rating" ] && rating=0

            local ts
            ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
            echo "{\"skill\":\"$skill_slug\",\"installs\":$installs,\"rating\":$rating,\"timestamp\":\"$ts\"}" >> "$stats_file"
            echo "$installs $rating"
            return 0
        fi
    fi

    # Fallback: try API endpoint
    local api_url="${CLAWHUB_REGISTRY:-https://clawhub.com}/api/skills/${skill_slug}/stats"
    local response
    response=$(curl -sf "$api_url" 2>/dev/null || echo "")
    if [ -n "$response" ]; then
        local installs rating ts
        # Parse JSON (portable: grep + sed)
        installs=$(echo "$response" | grep -oE '"installs"[[:space:]]*:[[:space:]]*[0-9]+' | grep -oE '[0-9]+' || echo "0")
        rating=$(echo "$response" | grep -oE '"rating"[[:space:]]*:[[:space:]]*[0-9.]+' | grep -oE '[0-9.]+' || echo "0")
        [ -z "$installs" ] && installs=0
        [ -z "$rating" ] && rating=0
        ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        echo "{\"skill\":\"$skill_slug\",\"installs\":$installs,\"rating\":$rating,\"timestamp\":\"$ts\"}" >> "$stats_file"
        echo "$installs $rating"
        return 0
    fi

    # If we have historical data, use last known
    if [ -f "$stats_file" ]; then
        tail -1 "$stats_file" | grep -oE '"installs":[0-9]+' | grep -oE '[0-9]+' || echo "0"
        return 0
    fi

    echo "0 0"
}

# ── Get list of our published skills ──
get_skill_list() {
    # From CRM publish log
    local crm_log="${CRM_LOG_DIR:-$(dirname "$0")/../../data/crm}/skill-publish-log.jsonl"
    if [ -f "$crm_log" ]; then
        grep -oE '"skill":"[^"]+"' "$crm_log" | sed 's/"skill":"//;s/"//' | sort -u
        return 0
    fi

    # From clawhub list (our skills)
    if command -v clawhub >/dev/null 2>&1; then
        clawhub list 2>/dev/null | grep -oE '^[a-z0-9-]+' || true
        return 0
    fi

    # From local skills directory
    local skills_dir="${CLAWHUB_WORKDIR:-$(pwd)/skills}"
    if [ -d "$skills_dir" ]; then
        for d in "$skills_dir"/*/; do
            [ -f "$d/SKILL.md" ] && basename "$d"
        done
        return 0
    fi

    warn "No skills found. Publish skills first or set CRM_LOG_DIR."
}

# ── Calculate growth ──
calc_growth() {
    local skill_slug="$1"
    local stats_file="$DATA_DIR/${skill_slug}.jsonl"

    if [ ! -f "$stats_file" ]; then
        echo "0"
        return
    fi

    local line_count
    line_count=$(wc -l < "$stats_file" | tr -d ' ')
    if [ "$line_count" -lt 2 ]; then
        echo "0"
        return
    fi

    local prev_installs curr_installs
    prev_installs=$(sed -n '$((line_count - 1))p' "$stats_file" 2>/dev/null | grep -oE '"installs":[0-9]+' | grep -oE '[0-9]+' || echo "0")
    curr_installs=$(tail -1 "$stats_file" | grep -oE '"installs":[0-9]+' | grep -oE '[0-9]+' || echo "0")

    [ -z "$prev_installs" ] && prev_installs=0
    [ -z "$curr_installs" ] && curr_installs=0

    if [ "$prev_installs" -eq 0 ]; then
        if [ "$curr_installs" -gt 0 ]; then echo "100"; else echo "0"; fi
        return
    fi

    # Integer percentage growth
    local diff growth
    diff=$((curr_installs - prev_installs))
    growth=$((diff * 100 / prev_installs))
    echo "$growth"
}

# ── Generate report ──
generate_report() {
    local report=""
    local date_str
    date_str=$(date -u +"%Y-%m-%d")
    local report_file="$REPORT_DIR/analytics-${REPORT_TYPE}-${date_str}.md"

    report="# ClawHub Skills Analytics — ${REPORT_TYPE} report"
    report="$report
Generated: $(date -u +"%Y-%m-%d %H:%M UTC")
"
    report="$report
## Skills Performance
"
    report="$report
| Skill | Installs | Rating | Growth |
|-------|----------|--------|--------|"

    local skills trending_skills=""
    if [ -n "$SKILL_FILTER" ]; then
        skills="$SKILL_FILTER"
    else
        skills=$(get_skill_list)
    fi

    if [ -z "$skills" ]; then
        warn "No skills to report on"
        echo "$report"
        return
    fi

    local total_installs=0
    local skill_count=0

    for skill in $skills; do
        info "Fetching stats for: $skill"
        local stats
        stats=$(fetch_skill_stats "$skill")
        local installs rating growth
        installs=$(echo "$stats" | awk '{print $1}')
        rating=$(echo "$stats" | awk '{print $2}')
        [ -z "$installs" ] && installs=0
        [ -z "$rating" ] && rating=0

        growth=$(calc_growth "$skill")

        local growth_display="$growth%"
        if [ "$growth" -ge "$TRENDING_THRESHOLD" ]; then
            growth_display="🔥 $growth%"
            trending_skills="$trending_skills $skill"
        elif [ "$growth" -gt 0 ]; then
            growth_display="📈 $growth%"
        elif [ "$growth" -lt 0 ]; then
            growth_display="📉 $growth%"
        fi

        if [ "$SHOW_TRENDING" = true ] && [ "$growth" -lt "$TRENDING_THRESHOLD" ]; then
            continue
        fi

        report="$report
| $skill | $installs | $rating/5 | $growth_display |"

        total_installs=$((total_installs + installs))
        skill_count=$((skill_count + 1))
    done

    report="$report

## Summary

- **Total skills tracked:** $skill_count
- **Total installs:** $total_installs
- **Report period:** $REPORT_TYPE
"

    if [ -n "$trending_skills" ]; then
        report="$report
## 🔥 Trending Skills (>${TRENDING_THRESHOLD}% growth)
"
        for ts in $trending_skills; do
            report="$report- **$ts** — consider featuring in marketing
"
        done
    fi

    # Write report
    echo "$report" > "$report_file"
    log "Report saved: $report_file"

    if [ -n "$OUTPUT_FILE" ]; then
        echo "$report" > "$OUTPUT_FILE"
        log "Report also saved: $OUTPUT_FILE"
    fi

    echo "$report"
}

# ── Main ──
info "ClawHub Skills Analytics — $REPORT_TYPE report"
generate_report
