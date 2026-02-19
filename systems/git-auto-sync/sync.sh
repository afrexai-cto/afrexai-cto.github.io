#!/usr/bin/env bash
# Git Auto-Sync: commit all changes, tag with timestamp, push to remote.
# Detects merge conflicts and notifies instead of forcing.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" 2>/dev/null && pwd)"
source "${SCRIPT_DIR}/config.sh"

# --- Helpers ---
log() { echo "[git-sync $(date '+%Y-%m-%d %H:%M:%S')] $*"; }

notify() {
  local msg="$1"
  log "NOTIFY: $msg"
  if [ -n "${SYNC_NOTIFY_CMD:-}" ]; then
    eval "$SYNC_NOTIFY_CMD" "\"$msg\"" 2>/dev/null || true
  fi
}

# --- Resolve branch ---
cd "$SYNC_REPO_PATH"

if [ -z "${SYNC_BRANCH}" ]; then
  SYNC_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'main')"
fi

log "Syncing repo=$SYNC_REPO_PATH remote=$SYNC_REMOTE branch=$SYNC_BRANCH"

# --- Check for uncommitted merge conflict state ---
if [ -f "${SYNC_REPO_PATH}/.git/MERGE_HEAD" ]; then
  notify "Merge in progress — skipping sync. Resolve conflicts manually."
  exit 1
fi

# --- Stage all changes ---
git add -A

# --- Check if there's anything to commit ---
if git diff --cached --quiet 2>/dev/null; then
  log "Nothing to commit."
else
  TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
  COMMIT_MSG="${SYNC_COMMIT_PREFIX} ${TIMESTAMP}"

  # Run pre-commit check explicitly (in case hook isn't installed)
  if [ -x "${SCRIPT_DIR}/pre-commit-hook.sh" ]; then
    if ! GIT_SYNC_CONFIG="${SCRIPT_DIR}/config.sh" "${SCRIPT_DIR}/pre-commit-hook.sh"; then
      notify "Auto-sync blocked: sensitive data detected in staged changes."
      git reset HEAD -- . >/dev/null 2>&1 || true
      exit 1
    fi
  fi

  git commit -m "$COMMIT_MSG"
  log "Committed: $COMMIT_MSG"

  # --- Tag ---
  TAG_NAME="${SYNC_TAG_PREFIX}${TIMESTAMP}"
  git tag "$TAG_NAME" 2>/dev/null || log "Tag $TAG_NAME already exists, skipping."
  log "Tagged: $TAG_NAME"
fi

# --- Fetch and check for conflicts before pushing ---
git fetch "$SYNC_REMOTE" "$SYNC_BRANCH" 2>/dev/null || {
  notify "Failed to fetch from ${SYNC_REMOTE}/${SYNC_BRANCH}. Network issue?"
  exit 1
}

LOCAL_HEAD="$(git rev-parse HEAD)"
REMOTE_HEAD="$(git rev-parse "${SYNC_REMOTE}/${SYNC_BRANCH}" 2>/dev/null || echo '')"
MERGE_BASE="$(git merge-base HEAD "${SYNC_REMOTE}/${SYNC_BRANCH}" 2>/dev/null || echo '')"

if [ "$LOCAL_HEAD" = "$REMOTE_HEAD" ]; then
  log "Already up to date with remote."
  exit 0
fi

if [ "$MERGE_BASE" = "$REMOTE_HEAD" ]; then
  # Local is ahead — safe to push
  git push "$SYNC_REMOTE" "$SYNC_BRANCH" --tags 2>/dev/null || {
    notify "Push failed to ${SYNC_REMOTE}/${SYNC_BRANCH}."
    exit 1
  }
  log "Pushed to ${SYNC_REMOTE}/${SYNC_BRANCH}."
elif [ "$MERGE_BASE" = "$LOCAL_HEAD" ]; then
  # Remote is ahead — try fast-forward pull
  log "Remote is ahead. Pulling..."
  git pull --ff-only "$SYNC_REMOTE" "$SYNC_BRANCH" 2>/dev/null || {
    notify "Cannot fast-forward from remote. Manual merge required."
    exit 1
  }
  log "Fast-forwarded from remote."
else
  # Diverged — do NOT force, notify instead
  notify "CONFLICT: Local and remote have diverged on branch '${SYNC_BRANCH}'. Manual merge required."
  exit 1
fi

log "Sync complete."
exit 0
