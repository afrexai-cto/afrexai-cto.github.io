#!/bin/bash
# Self-healing server + tunnel keepalive
# Runs via crontab every minute, only starts if not already running

PORT=3700
DEMO_DIR="/Users/openclaw/.openclaw/workspace-main/demo"
LOG="/tmp/afrexai-demo.log"
TUNNEL_LOG="/tmp/cloudflared.log"
PIDFILE_SERVER="/tmp/afrexai-server.pid"
PIDFILE_TUNNEL="/tmp/afrexai-tunnel.pid"

# Load API key
source /Users/openclaw/.openclaw/vault/anthropic.env 2>/dev/null
export ANTHROPIC_API_KEY

# Check if server is running on port
if ! lsof -i :$PORT -sTCP:LISTEN > /dev/null 2>&1; then
    echo "[$(date)] Starting server..." >> "$LOG"
    cd "$DEMO_DIR"
    AFREX_PORT=$PORT nohup node server/index.js >> "$LOG" 2>&1 &
    echo $! > "$PIDFILE_SERVER"
    sleep 2
fi

# Check if cloudflared tunnel is running
if ! pgrep -f "cloudflared tunnel" > /dev/null 2>&1; then
    if [ -f /tmp/cloudflared ]; then
        echo "[$(date)] Starting tunnel..." >> "$TUNNEL_LOG"
        nohup /tmp/cloudflared tunnel --url http://localhost:$PORT >> "$TUNNEL_LOG" 2>&1 &
        echo $! > "$PIDFILE_TUNNEL"
    fi
fi
