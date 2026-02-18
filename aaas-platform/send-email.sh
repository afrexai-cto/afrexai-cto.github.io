#!/usr/bin/env bash
# Convenience wrapper — delegates to onboarding/send-email.sh
exec bash "$(dirname "$0")/onboarding/send-email.sh" "$@"
