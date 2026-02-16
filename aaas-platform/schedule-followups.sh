#!/usr/bin/env bash
# Convenience wrapper — delegates to onboarding/schedule-followups.sh
exec bash "$(dirname "$0")/onboarding/schedule-followups.sh" "$@"
