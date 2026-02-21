#!/bin/bash
# ============================================================================
# ORCHESTRATOR: Runs all agents in sequence via HANDOFF.md routing
# ============================================================================
set -e
DEMO_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "══════════════════════════════════════════════════════════"
echo "  OpenClaw Agent Pipeline — Client Onboarding Demo"
echo "  Hartwell Associates LLP"
echo "══════════════════════════════════════════════════════════"
echo ""

# Clean previous run
rm -rf "$DEMO_DIR/demo-output" "$DEMO_DIR/HANDOFF.md"

echo "[1/5] Running Trigger..."
bash "$DEMO_DIR/trigger.sh"

echo "[2/5] Running EA Agent..."
bash "$DEMO_DIR/ea-agent.sh"

echo "[3/5] Running Research Agent..."
bash "$DEMO_DIR/researcher-agent.sh"

echo "[4/5] Running PM Agent..."
bash "$DEMO_DIR/pm-agent.sh"

echo "[5/5] Running Billing Agent..."
bash "$DEMO_DIR/billing-agent.sh"

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  ✅ PIPELINE COMPLETE"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "Generated artifacts:"
find "$DEMO_DIR/demo-output" -type f | sort | while read f; do
  echo "  📄 ${f#$DEMO_DIR/}"
done
echo ""
echo "Agent handoff log: HANDOFF.md"
echo "Timeline: demo-output/timeline.log"
