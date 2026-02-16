#!/usr/bin/env bash
# Convenience wrapper — delegates to onboarding/orchestrator.sh
exec bash "$(dirname "$0")/onboarding/orchestrator.sh" "$@"
