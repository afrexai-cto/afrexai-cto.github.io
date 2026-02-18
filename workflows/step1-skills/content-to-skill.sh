#!/bin/bash
# content-to-skill.sh — Convert markdown/research content into a packaged ClawHub skill
# Bash 3.2 compatible
#
# Usage: ./content-to-skill.sh --input <file.md> --name <skill-slug> [--category <cat>] [--publish]

set -euo pipefail

# ── Defaults ──
INPUT_FILE=""
SKILL_NAME=""
CATEGORY="other"
AUTO_PUBLISH=false
WORKSPACE="${CLAWHUB_WORKDIR:-$(pwd)/skills}"
QUEUE_DIR="${PUBLISH_QUEUE_DIR:-$(dirname "$0")/../../data/publish-queue}"

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
  --input <file>       Input markdown file or research document
  --name <slug>        Skill slug name

Optional:
  --category <cat>     Category (default: other)
  --workspace <dir>    Skills output directory
  --publish            Auto-publish after conversion
  -h, --help           Show this help
EOF
    exit 0
}

# ── Parse args ──
while [ $# -gt 0 ]; do
    case "$1" in
        --input)     INPUT_FILE="$2"; shift 2 ;;
        --name)      SKILL_NAME="$2"; shift 2 ;;
        --category)  CATEGORY="$2"; shift 2 ;;
        --workspace) WORKSPACE="$2"; shift 2 ;;
        --publish)   AUTO_PUBLISH=true; shift ;;
        -h|--help)   usage ;;
        *)           err "Unknown option: $1"; usage ;;
    esac
done

if [ -z "$INPUT_FILE" ] || [ -z "$SKILL_NAME" ]; then
    err "Missing required: --input and --name"
    usage
fi

if [ ! -f "$INPUT_FILE" ]; then
    err "Input file not found: $INPUT_FILE"
    exit 1
fi

# ── Extract content metadata ──
info "Analysing input: $INPUT_FILE"

# Extract title (first H1, or first line, or filename)
TITLE=$(grep -m1 '^# ' "$INPUT_FILE" | sed 's/^# //' || echo "")
if [ -z "$TITLE" ]; then
    TITLE=$(head -1 "$INPUT_FILE" | sed 's/^[#* ]*//')
fi
if [ -z "$TITLE" ]; then
    TITLE="$SKILL_NAME"
fi

# Extract description (first paragraph after title, max 200 chars)
DESCRIPTION=$(awk '
    /^# / { found=1; next }
    found && /^$/ { next }
    found && /^[^#]/ { print; exit }
    !found && NR > 1 && /^[^#]/ && !/^[-*]/ { print; exit }
' "$INPUT_FILE" | head -1 | cut -c1-200)

if [ -z "$DESCRIPTION" ]; then
    DESCRIPTION="Skill generated from: $(basename "$INPUT_FILE")"
fi

# Count sections for structure analysis
SECTION_COUNT=$(grep -c '^## ' "$INPUT_FILE" 2>/dev/null || echo "0")
WORD_COUNT=$(wc -w < "$INPUT_FILE" | tr -d ' ')

log "Title: $TITLE"
log "Description: $DESCRIPTION"
info "Sections: $SECTION_COUNT | Words: $WORD_COUNT"

# ── Build skill directory ──
SKILL_DIR="$WORKSPACE/$SKILL_NAME"
mkdir -p "$SKILL_DIR/scripts" "$SKILL_DIR/assets" "$SKILL_DIR/docs"

# ── Extract structured sections into skill content ──

# Copy original as reference
cp "$INPUT_FILE" "$SKILL_DIR/docs/source.md"
log "Copied source document to docs/"

# Extract code blocks as scripts
SCRIPT_INDEX=0
awk '
    /^```(bash|sh|shell)/ { capture=1; next }
    /^```/ && capture { capture=0; next }
    capture { print }
' "$INPUT_FILE" > "$SKILL_DIR/scripts/_extracted_commands.sh" 2>/dev/null || true

EXTRACTED_LINES=$(wc -l < "$SKILL_DIR/scripts/_extracted_commands.sh" | tr -d ' ')
if [ "$EXTRACTED_LINES" -gt 0 ]; then
    # Add shebang and make executable
    TEMP_FILE=$(mktemp)
    echo '#!/bin/bash' > "$TEMP_FILE"
    echo '# Extracted commands from source document' >> "$TEMP_FILE"
    echo 'set -euo pipefail' >> "$TEMP_FILE"
    echo '' >> "$TEMP_FILE"
    cat "$SKILL_DIR/scripts/_extracted_commands.sh" >> "$TEMP_FILE"
    mv "$TEMP_FILE" "$SKILL_DIR/scripts/_extracted_commands.sh"
    chmod +x "$SKILL_DIR/scripts/_extracted_commands.sh"
    log "Extracted $EXTRACTED_LINES lines of shell commands"
else
    rm -f "$SKILL_DIR/scripts/_extracted_commands.sh"
fi

# Extract key points / bullet lists as a quick-reference
grep -E '^\s*[-*] ' "$INPUT_FILE" > "$SKILL_DIR/docs/key-points.md" 2>/dev/null || true

# ── Generate SKILL.md ──

# Build the instruction content from document sections
INSTRUCTIONS=$(awk '
    /^## / { section=$0; next }
    /^# /  { next }
    section && /^[^#]/ && NF > 0 { print }
' "$INPUT_FILE" | head -100)

if [ -z "$INSTRUCTIONS" ]; then
    INSTRUCTIONS=$(sed '1,2d' "$INPUT_FILE" | head -100)
fi

cat > "$SKILL_DIR/SKILL.md" <<SKILLEOF
---
name: $SKILL_NAME
description: $DESCRIPTION
metadata:
  {
    "openclaw":
      {
        "emoji": "📄",
        "category": "$CATEGORY",
        "version": "1.0.0",
        "author": "AfrexAI",
        "source": "content-to-skill",
        "source_file": "$(basename "$INPUT_FILE")"
      }
  }
---

# $TITLE

$DESCRIPTION

## Knowledge

$INSTRUCTIONS

## Usage

This skill was generated from research/content. The agent can use this knowledge to:
- Answer questions about $(echo "$TITLE" | tr '[:upper:]' '[:lower:]')
- Follow documented procedures and commands
- Reference source material in docs/source.md

## Source

Original document: docs/source.md
Key points: docs/key-points.md
SKILLEOF

log "Generated SKILL.md"

# Generate README
cat > "$SKILL_DIR/README.md" <<READMEEOF
# $TITLE

$DESCRIPTION

## Installation

\`\`\`bash
clawhub install $SKILL_NAME
\`\`\`

## About

This skill was auto-generated from content/research using the AfrexAI content-to-skill pipeline.

- **Category:** $CATEGORY
- **Source:** $(basename "$INPUT_FILE") ($WORD_COUNT words, $SECTION_COUNT sections)
- **Generated:** $(date -u +"%Y-%m-%d")
READMEEOF

log "Generated README.md"

# ── Add to publish queue ──
info "Adding to publish queue..."
mkdir -p "$QUEUE_DIR"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat > "$QUEUE_DIR/${SKILL_NAME}.json" <<QUEUEEOF
{
  "skill": "$SKILL_NAME",
  "display_name": "$TITLE",
  "description": "$DESCRIPTION",
  "category": "$CATEGORY",
  "version": "1.0.0",
  "source_file": "$(realpath "$INPUT_FILE" 2>/dev/null || echo "$INPUT_FILE")",
  "skill_dir": "$SKILL_DIR",
  "queued_at": "$TIMESTAMP",
  "status": "queued"
}
QUEUEEOF

log "Added to publish queue: $QUEUE_DIR/${SKILL_NAME}.json"

# ── Auto-publish if requested ──
if [ "$AUTO_PUBLISH" = true ]; then
    PIPELINE="$(dirname "$0")/skill-publish-pipeline.sh"
    if [ -x "$PIPELINE" ]; then
        info "Auto-publishing via pipeline..."
        "$PIPELINE" \
            --name "$SKILL_NAME" \
            --display-name "$TITLE" \
            --description "$DESCRIPTION" \
            --category "$CATEGORY" \
            --workspace "$WORKSPACE"
    else
        warn "Pipeline script not found at: $PIPELINE"
        warn "Publish manually: clawhub publish $SKILL_DIR --slug $SKILL_NAME"
    fi
fi

# ── Summary ──
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "Content converted to skill: $SKILL_NAME"
echo ""
echo "  Source:     $(basename "$INPUT_FILE") ($WORD_COUNT words)"
echo "  Skill dir:  $SKILL_DIR"
echo "  Category:   $CATEGORY"
echo "  Queue:      $QUEUE_DIR/${SKILL_NAME}.json"
if [ "$AUTO_PUBLISH" = false ]; then
    echo ""
    echo "  To publish: ./skill-publish-pipeline.sh --name $SKILL_NAME --display-name \"$TITLE\" --description \"$DESCRIPTION\" --category $CATEGORY"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
