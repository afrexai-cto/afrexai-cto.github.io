#!/bin/bash
# AfrexAI Demo Server + Cloudflare Tunnel
# Run from Terminal: bash ~/.openclaw/workspace-main/demo/run-tunnel.sh

set -e
DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"

# Kill any existing instances
pkill -f "AFREX_PORT=3700" 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 1

# Start Express server
echo "[AfrexAI] Starting backend on port 3700..."
cd "$DEMO_DIR"
AFREX_PORT=3700 node server/index.js &
SERVER_PID=$!
sleep 2

# Start Cloudflare tunnel
echo "[AfrexAI] Starting Cloudflare tunnel..."
/tmp/cloudflared tunnel --url http://localhost:3700 2>&1 | tee /tmp/cloudflared.log &
TUNNEL_PID=$!

echo ""
echo "[AfrexAI] Server PID: $SERVER_PID"
echo "[AfrexAI] Tunnel PID: $TUNNEL_PID"
echo "[AfrexAI] Watch for the tunnel URL in the output above (*.trycloudflare.com)"
echo ""
echo "Press Ctrl+C to stop both."

# Trap Ctrl+C to kill both
trap "kill $SERVER_PID $TUNNEL_PID 2>/dev/null; exit" INT TERM
wait
