#!/bin/bash
cd /Users/openclaw/.openclaw/workspace-main

# Load API key
source /Users/openclaw/.openclaw/vault/anthropic.env 2>/dev/null
export ANTHROPIC_API_KEY

# Part A: generate new pending tasks
node demo/agents/real-agent-runner.js --generate

# Part B: process completed deliverables into activity.json
node demo/agents/real-agent-runner.js --process

# Also run filler generator
node demo/agents/lib/generate.js
