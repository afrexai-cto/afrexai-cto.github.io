#!/usr/bin/env bash
# generate-auth-index.sh — Generate portal/auth-index.json from customer profile.json files
# Maps SHA-256(api_key) → customer_slug
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLATFORM_DIR="$(cd "$SCRIPT_DIR/../../aaas-platform" && pwd)"
CUSTOMERS_DIR="$PLATFORM_DIR/customers"
OUTPUT="${1:-$SCRIPT_DIR/../../portal/data/auth-index.json}"

mkdir -p "$(dirname "$OUTPUT")"

echo '{'
echo '  "token_hashes": {'

first=true
for cdir in "$CUSTOMERS_DIR"/*/; do
    [ -f "$cdir/profile.json" ] || continue
    slug="$(basename "$cdir")"
    
    # Extract api_key from profile.json
    api_key="$(python3 -c "
import json
p = json.load(open('$cdir/profile.json'))
print(p.get('api_key', ''))
" 2>/dev/null || true)"
    
    [ -z "$api_key" ] && continue
    
    # SHA-256 hash of the api_key
    hash="$(echo -n "$api_key" | shasum -a 256 | awk '{print $1}')"
    
    if [ "$first" = true ]; then
        first=false
    else
        echo ','
    fi
    printf '    "%s": "%s"' "$hash" "$slug"
done

echo ''
echo '  }'
echo '}'
) > "$OUTPUT"

echo "✓ Auth index written to $OUTPUT"
