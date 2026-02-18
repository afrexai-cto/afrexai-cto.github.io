#!/bin/bash
cd /Users/openclaw/.openclaw/workspace-main
if git diff --quiet demo/data/activity.json 2>/dev/null; then
  exit 0
fi
git add demo/data/activity.json
git commit -m "📊 demo data $(date +%H:%M)"
GIT_SSH_COMMAND="ssh -i ~/.ssh/afrexai-deploy -o IdentitiesOnly=yes" git push origin main
