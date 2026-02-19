#!/usr/bin/env bash
# config.sh - Database Backup Configuration
# All paths are relative to this script's directory unless absolute.

# Root directory to scan for SQLite databases
SCAN_ROOT="${SCAN_ROOT:-/Users/openclaw/.openclaw/workspace-main}"

# Backup destination directory
BACKUP_DIR="${BACKUP_DIR:-/Users/openclaw/.openclaw/workspace-main/systems/db-backups/backups}"

# Number of backups to retain
BACKUP_RETAIN="${BACKUP_RETAIN:-7}"

# Encryption password (override via environment for security)
# In production, use: export BACKUP_ENC_PASS=$(op read "op://AfrexAI/db-backup/password")
BACKUP_ENC_PASS="${BACKUP_ENC_PASS:-changeme-set-env-var}"

# OpenSSL cipher
BACKUP_CIPHER="${BACKUP_CIPHER:-aes-256-cbc}"

# Alert file for failure notifications
ALERT_FILE="${ALERT_FILE:-/Users/openclaw/.openclaw/workspace-main/systems/db-backups/ALERT.md}"

# Directories to exclude from scan (colon-separated)
SCAN_EXCLUDE="${SCAN_EXCLUDE:-node_modules:.git:backups}"

# Google Drive upload (stub) - set to "true" to enable
GDRIVE_UPLOAD="${GDRIVE_UPLOAD:-false}"
GDRIVE_DEST="${GDRIVE_DEST:-}"

# Timestamp format for backup filenames
TS_FMT="%Y%m%d-%H%M%S"
