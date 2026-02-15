#!/bin/bash
# Adds Open Graph and Twitter Card meta tags to HTML files that don't have them.
# Usage: bash scripts/add-meta-tags.sh

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
BASE_URL="https://afrexai-cto.github.io"
DEFAULT_IMAGE="$BASE_URL/assets/og-image.png"
COUNT=0

find "$WORKSPACE" -name "*.html" \
    -not -path "*/_includes/*" \
    -not -path "*/scripts/*" \
    -not -path "*/node_modules/*" \
    -not -path "*/outbound/templates/*" | while read -r file; do

    # Skip if already has og:title
    if grep -q 'og:title' "$file" 2>/dev/null; then
        continue
    fi

    # Skip if no </head>
    if ! grep -q '</head>' "$file" 2>/dev/null; then
        continue
    fi

    # Extract title
    TITLE=$(grep -o '<title>[^<]*</title>' "$file" | head -1 | sed 's/<[^>]*>//g')
    if [ -z "$TITLE" ]; then
        TITLE="AfrexAI - AI Workforce Solutions"
    fi

    # Build URL path from file path
    REL_PATH="${file#$WORKSPACE}"
    if [[ "$REL_PATH" == */index.html ]]; then
        REL_PATH="${REL_PATH%index.html}"
    fi
    PAGE_URL="$BASE_URL$REL_PATH"

    # Generate description from title
    DESC="$TITLE - AI-powered workforce solutions by AfrexAI. Automate operations, cut costs, and grow revenue."

    # Build meta tags block
    META_TAGS="    <meta property=\"og:title\" content=\"$TITLE\">
    <meta property=\"og:description\" content=\"$DESC\">
    <meta property=\"og:url\" content=\"$PAGE_URL\">
    <meta property=\"og:image\" content=\"$DEFAULT_IMAGE\">
    <meta property=\"og:type\" content=\"website\">
    <meta name=\"twitter:card\" content=\"summary_large_image\">
    <meta name=\"twitter:title\" content=\"$TITLE\">
    <meta name=\"twitter:description\" content=\"$DESC\">"

    # Inject before </head> (macOS compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # Use python for reliable multi-line insert
        python3 -c "
import sys
with open('$file', 'r') as f:
    content = f.read()
tags = '''$META_TAGS'''
content = content.replace('</head>', tags + '\n</head>', 1)
with open('$file', 'w') as f:
    f.write(content)
"
    else
        sed -i "/<\/head>/i\\$META_TAGS" "$file"
    fi

    echo "✓ $file"
    COUNT=$((COUNT + 1))
done

echo "Done. Added meta tags to $COUNT files."
