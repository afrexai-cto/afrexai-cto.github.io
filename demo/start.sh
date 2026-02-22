#!/bin/bash
# Start the AfrexAI demo production server
# Usage: ./start.sh [port]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"
PORT="${1:-3700}"

# Install deps if needed
if [ ! -d "$SERVER_DIR/node_modules" ]; then
  echo "[AfrexAI] Installing dependencies..."
  cd "$SERVER_DIR"
  npm install --production 2>/dev/null
  cd -
fi

echo "[AfrexAI] Starting server on port $PORT..."
AFREX_PORT="$PORT" node "$SERVER_DIR/index.js"
