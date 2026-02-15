#!/bin/bash
# Injects GA4 snippet into all HTML files that don't already have it.
# Usage: bash scripts/add-analytics.sh
# Replace G-XXXXXXXXXX in _includes/analytics.html with your real GA4 ID first.

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
SNIPPET="$WORKSPACE/_includes/analytics.html"

if [ ! -f "$SNIPPET" ]; then
    echo "ERROR: $SNIPPET not found"
    exit 1
fi

SNIPPET_CONTENT=$(cat "$SNIPPET")
COUNT=0

find "$WORKSPACE" -name "*.html" \
    -not -path "*/_includes/*" \
    -not -path "*/scripts/*" \
    -not -path "*/node_modules/*" \
    -not -path "*/outbound/templates/*" | while read -r file; do

    # Skip if already has GA
    if grep -q "googletagmanager.com/gtag" "$file" 2>/dev/null; then
        continue
    fi

    # Skip if no </head> tag
    if ! grep -q "</head>" "$file" 2>/dev/null; then
        continue
    fi

    # Inject before </head>
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "/<\/head>/i\\
$(echo "$SNIPPET_CONTENT" | sed 's/$/\\/' | sed '$ s/\\$//')
" "$file"
    else
        sed -i "/<\/head>/i\\$SNIPPET_CONTENT" "$file"
    fi

    echo "✓ $file"
    COUNT=$((COUNT + 1))
done

echo "Done. Injected GA4 into $COUNT files."
