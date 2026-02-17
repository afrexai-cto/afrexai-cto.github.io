#!/bin/bash
# Finds the oldest .prompt file in pending/, extracts the prompt content,
# and prints it to stdout. Exits 1 if no prompts pending.
#
# The agentTurn cron can use this to get the next prompt to process.
# After generating content, write a .done file to completed/ with:
#   ---METADATA---
#   { ...same metadata from the prompt file... }
#   ---CONTENT---
#   <generated content here>

PENDING_DIR="$(dirname "$0")/pending"

OLDEST=$(ls -1t "$PENDING_DIR"/*.prompt 2>/dev/null | tail -1)

if [ -z "$OLDEST" ]; then
  echo "No pending prompts." >&2
  exit 1
fi

BASENAME=$(basename "$OLDEST")
echo "Processing: $BASENAME" >&2

# Extract metadata and prompt
METADATA=$(sed -n '/^---METADATA---$/,/^---PROMPT---$/{ /^---/d; p; }' "$OLDEST")
PROMPT=$(sed -n '/^---PROMPT---$/,$ { /^---PROMPT---$/d; p; }' "$OLDEST")

# Output the prompt to stdout
echo "$PROMPT"

# Output metadata to stderr for the caller to capture if needed
echo "---PROMPT-META---" >&2
echo "$METADATA" >&2
echo "---PROMPT-FILE---" >&2
echo "$OLDEST" >&2
