#!/bin/bash
# skill-publish-pipeline.sh — Automate skill creation → testing → publishing to ClawHub
# Bash 3.2 compatible (no declare -A, no associative arrays)
#
# Usage: ./skill-publish-pipeline.sh --name <slug> --display-name "My Skill" --description "..." --category <category> [--version 1.0.0] [--dry-run]
#
# Categories: productivity, automation, integration, analytics, communication, devops, finance, marketing, other

set -euo pipefail

# ── Defaults ──
SKILL_NAME=""
DISPLAY_NAME=""
DESCRIPTION=""
CATEGORY="other"
VERSION="1.0.0"
DRY_RUN=false
WORKSPACE="${CLAWHUB_WORKDIR:-$(pwd)/skills}"
CRM_LOG="${CRM_LOG_DIR:-$(dirname "$0")/../../data/crm}/skill-publish-log.jsonl"
CHANGELOG="Initial release"

# ── Colours ──
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

log()  { printf "${GREEN}[✓]${NC} %s\n" "$1"; }
warn() { printf "${YELLOW}[!]${NC} %s\n" "$1"; }
err()  { printf "${RED}[✗]${NC} %s\n" "$1" >&2; }
info() { printf "${BLUE}[i]${NC} %s\n" "$1"; }

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Required:
  --name <slug>            Skill slug (e.g. my-skill)
  --display-name "Name"    Human-readable name
  --description "..."      Short description
  --category <cat>         Category (productivity|automation|integration|analytics|communication|devops|finance|marketing|other)

Optional:
  --version <ver>          Version (default: 1.0.0)
  --changelog "..."        Changelog message (default: "Initial release")
  --workspace <dir>        Skills workspace directory
  --dry-run                Scaffold and validate only, don't publish
  -h, --help               Show this help
EOF
    exit 0
}

# ── Parse args ──
while [ $# -gt 0 ]; do
    case "$1" in
        --name)         SKILL_NAME="$2"; shift 2 ;;
        --display-name) DISPLAY_NAME="$2"; shift 2 ;;
        --description)  DESCRIPTION="$2"; shift 2 ;;
        --category)     CATEGORY="$2"; shift 2 ;;
        --version)      VERSION="$2"; shift 2 ;;
        --changelog)    CHANGELOG="$2"; shift 2 ;;
        --workspace)    WORKSPACE="$2"; shift 2 ;;
        --dry-run)      DRY_RUN=true; shift ;;
        -h|--help)      usage ;;
        *)              err "Unknown option: $1"; usage ;;
    esac
done

# ── Validate required params ──
if [ -z "$SKILL_NAME" ] || [ -z "$DISPLAY_NAME" ] || [ -z "$DESCRIPTION" ]; then
    err "Missing required parameters: --name, --display-name, --description"
    usage
fi

# Validate slug format
if ! echo "$SKILL_NAME" | grep -qE '^[a-z0-9][a-z0-9-]*[a-z0-9]$'; then
    err "Skill name must be lowercase alphanumeric with hyphens (e.g. my-skill)"
    exit 1
fi

# Validate category
VALID_CATS="productivity automation integration analytics communication devops finance marketing other"
VALID=false
for c in $VALID_CATS; do
    if [ "$c" = "$CATEGORY" ]; then VALID=true; break; fi
done
if [ "$VALID" = false ]; then
    err "Invalid category: $CATEGORY"
    err "Valid: $VALID_CATS"
    exit 1
fi

SKILL_DIR="$WORKSPACE/$SKILL_NAME"

# ── Step 1: Scaffold ──
info "Scaffolding skill: $SKILL_NAME"

if [ -d "$SKILL_DIR" ]; then
    warn "Directory already exists: $SKILL_DIR"
    printf "Overwrite? [y/N] "
    read -r REPLY
    if [ "$REPLY" != "y" ] && [ "$REPLY" != "Y" ]; then
        err "Aborted."
        exit 1
    fi
fi

mkdir -p "$SKILL_DIR/scripts" "$SKILL_DIR/assets"

# Generate SKILL.md
cat > "$SKILL_DIR/SKILL.md" <<SKILLEOF
---
name: $SKILL_NAME
description: $DESCRIPTION
metadata:
  {
    "openclaw":
      {
        "emoji": "🔧",
        "category": "$CATEGORY",
        "version": "$VERSION",
        "author": "AfrexAI",
        "homepage": "https://clawhub.com/skills/$SKILL_NAME"
      }
  }
---

# $DISPLAY_NAME

$DESCRIPTION

## Usage

\`\`\`
# Describe how to use this skill
\`\`\`

## Configuration

No configuration required.

## Examples

<!-- Add usage examples here -->

## Notes

- Published by AfrexAI via ClawHub
- Category: $CATEGORY
- Version: $VERSION
SKILLEOF

log "Created SKILL.md"

# Generate placeholder script
cat > "$SKILL_DIR/scripts/main.sh" <<'SCRIPTEOF'
#!/bin/bash
# Main skill script — edit this for your skill's functionality
set -euo pipefail

echo "Skill executing..."
# Add your skill logic here
SCRIPTEOF
chmod +x "$SKILL_DIR/scripts/main.sh"
log "Created scripts/main.sh"

# Generate README
cat > "$SKILL_DIR/README.md" <<READMEEOF
# $DISPLAY_NAME

$DESCRIPTION

## Installation

\`\`\`bash
clawhub install $SKILL_NAME
\`\`\`

## Category

$CATEGORY

## Version

$VERSION

## Author

AfrexAI
READMEEOF
log "Created README.md"

# ── Step 2: Validate ──
info "Running validation checks..."

ERRORS=0

# Check SKILL.md exists and has frontmatter
if [ ! -f "$SKILL_DIR/SKILL.md" ]; then
    err "Missing SKILL.md"
    ERRORS=$((ERRORS + 1))
fi

# Check frontmatter has required fields
if ! grep -q "^name:" "$SKILL_DIR/SKILL.md" 2>/dev/null; then
    err "SKILL.md missing 'name' in frontmatter"
    ERRORS=$((ERRORS + 1))
fi

if ! grep -q "^description:" "$SKILL_DIR/SKILL.md" 2>/dev/null; then
    err "SKILL.md missing 'description' in frontmatter"
    ERRORS=$((ERRORS + 1))
fi

# Check name matches directory
FRONTMATTER_NAME=$(grep "^name:" "$SKILL_DIR/SKILL.md" 2>/dev/null | head -1 | sed 's/^name: *//')
if [ "$FRONTMATTER_NAME" != "$SKILL_NAME" ]; then
    err "SKILL.md name '$FRONTMATTER_NAME' doesn't match directory name '$SKILL_NAME'"
    ERRORS=$((ERRORS + 1))
fi

# Check description isn't empty
if [ -z "$DESCRIPTION" ]; then
    err "Description is empty"
    ERRORS=$((ERRORS + 1))
fi

# Check for scripts
SCRIPT_COUNT=$(find "$SKILL_DIR/scripts" -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$SCRIPT_COUNT" -eq 0 ]; then
    warn "No scripts found in scripts/ directory"
fi

# Version format check
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
    err "Version '$VERSION' is not valid semver (expected X.Y.Z)"
    ERRORS=$((ERRORS + 1))
fi

if [ "$ERRORS" -gt 0 ]; then
    err "Validation failed with $ERRORS error(s)"
    exit 1
fi

log "Validation passed ✓"

# ── Step 3: Publish ──
if [ "$DRY_RUN" = true ]; then
    info "Dry run — skipping publish"
    info "Skill scaffolded at: $SKILL_DIR"
    exit 0
fi

info "Publishing to ClawHub..."

if ! command -v clawhub >/dev/null 2>&1; then
    err "clawhub CLI not found. Install with: npm i -g clawhub"
    exit 1
fi

clawhub publish "$SKILL_DIR" \
    --slug "$SKILL_NAME" \
    --name "$DISPLAY_NAME" \
    --version "$VERSION" \
    --changelog "$CHANGELOG"

PUBLISH_STATUS=$?

if [ $PUBLISH_STATUS -eq 0 ]; then
    log "Published $SKILL_NAME@$VERSION to ClawHub"
else
    err "Publish failed (exit code: $PUBLISH_STATUS)"
    exit 1
fi

# ── Step 4: Log to CRM ──
info "Logging to CRM..."

mkdir -p "$(dirname "$CRM_LOG")"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat >> "$CRM_LOG" <<CRMEOF
{"event":"skill_published","skill":"$SKILL_NAME","display_name":"$DISPLAY_NAME","version":"$VERSION","category":"$CATEGORY","timestamp":"$TIMESTAMP","description":"$DESCRIPTION"}
CRMEOF

log "Logged to CRM: $CRM_LOG"

# ── Done ──
echo ""
log "Pipeline complete: $SKILL_NAME@$VERSION published to ClawHub"
echo "  Directory: $SKILL_DIR"
echo "  ClawHub:   https://clawhub.com/skills/$SKILL_NAME"
