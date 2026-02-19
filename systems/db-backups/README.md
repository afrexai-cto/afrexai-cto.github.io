# Database Backup System

Automated SQLite database backup with encryption, rotation, and restore.

## Quick Start

```bash
# Set encryption password
export BACKUP_ENC_PASS="your-secure-password"

# Run backup
./backup.sh

# List & restore
./restore.sh                              # shows available backups
./restore.sh backup-20260219-030000.tar.enc  # restore specific backup
./restore.sh backup-20260219-030000.tar.enc /tmp/restore  # restore to specific dir
```

## Scripts

| Script | Purpose |
|---|---|
| `config.sh` | All configuration (paths, retention, encryption) |
| `discover-dbs.sh` | Auto-find all SQLite databases under scan root |
| `backup.sh` | Full backup: discover → copy → encrypt → rotate |
| `restore.sh` | Decrypt and extract a backup archive |
| `rotate.sh` | Keep last N backups, delete older ones |

## Features

- **Auto-discovery**: Finds all SQLite DBs by extension AND magic bytes
- **Safe copies**: Uses `sqlite3 .backup` for consistent snapshots
- **Encrypted archives**: AES-256-CBC via OpenSSL with PBKDF2
- **Auto-rotation**: Keeps last 7 backups (configurable)
- **Failure alerts**: Writes to `ALERT.md` for pickup by monitoring
- **Google Drive stub**: Ready for `rclone` integration

## Hourly Automation

Add to crontab (`crontab -e`):

```
0 * * * * BACKUP_ENC_PASS="your-pass" /path/to/systems/db-backups/backup.sh >> /path/to/systems/db-backups/backup.log 2>&1
```

Or use OpenClaw cron:
```
openclaw cron add --every 1h --command "cd /Users/openclaw/.openclaw/workspace-main/systems/db-backups && BACKUP_ENC_PASS=your-pass ./backup.sh"
```

## Configuration

Edit `config.sh` or override via environment variables:

- `SCAN_ROOT` — directory to scan for databases
- `BACKUP_DIR` — where to store backups
- `BACKUP_RETAIN` — number of backups to keep (default: 7)
- `BACKUP_ENC_PASS` — encryption password (**required**)
- `BACKUP_CIPHER` — OpenSSL cipher (default: aes-256-cbc)
- `SCAN_EXCLUDE` — colon-separated dirs to skip
- `GDRIVE_UPLOAD` — set to "true" to enable upload stub

## Security

- Store `BACKUP_ENC_PASS` in 1Password: `op read "op://AfrexAI/db-backup/password"`
- Never commit passwords to version control
- Backup archives are encrypted at rest
