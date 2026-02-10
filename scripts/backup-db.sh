#!/usr/bin/env bash

#
# SOCC Dashboard Database Backup Script
#
# Backs up the SQLite database with intelligent retention:
# - Daily backups: Keep last 7 days
# - Weekly backups: Keep last 4 weeks (Sundays)
# - Monthly backups: Keep last 12 months (1st of month)
#
# Usage: ./scripts/backup-db.sh
# Can be run via cron: 0 2 * * * /path/to/scripts/backup-db.sh
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_FILE="$PROJECT_DIR/server/data/socc.db"
BACKUP_DIR="$PROJECT_DIR/server/data/backups"
DATE=$(date +%Y%m%d)
TIME=$(date +%H%M%S)
DOW=$(date +%u)  # Day of week (1-7, Monday=1)
DOM=$(date +%d)  # Day of month (01-31)

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly}

# Check if database exists
if [ ! -f "$DB_FILE" ]; then
    echo "❌ Error: Database file not found at $DB_FILE"
    exit 1
fi

# Perform backup using SQLite's backup command (safe while server is running)
echo "🔄 Backing up database..."
BACKUP_FILE="$BACKUP_DIR/daily/socc-$DATE-$TIME.db"

if command -v sqlite3 >/dev/null 2>&1; then
    # Use SQLite CLI for backup (preferred method)
    sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"
else
    # Fallback to simple copy (requires server to be stopped)
    echo "⚠️  Warning: sqlite3 command not found, using file copy"
    echo "⚠️  Ensure the server is stopped before running this script"
    cp "$DB_FILE" "$BACKUP_FILE"
fi

# Verify backup integrity
if sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" | grep -q "ok"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup successful: $BACKUP_FILE ($BACKUP_SIZE)"
else
    echo "❌ Backup failed integrity check"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Copy to weekly backup if it's Sunday
if [ "$DOW" = "7" ]; then
    WEEKLY_BACKUP="$BACKUP_DIR/weekly/socc-$DATE.db"
    cp "$BACKUP_FILE" "$WEEKLY_BACKUP"
    echo "📅 Weekly backup saved: $WEEKLY_BACKUP"
fi

# Copy to monthly backup if it's the 1st of the month
if [ "$DOM" = "01" ]; then
    MONTHLY_BACKUP="$BACKUP_DIR/monthly/socc-$DATE.db"
    cp "$BACKUP_FILE" "$MONTHLY_BACKUP"
    echo "📅 Monthly backup saved: $MONTHLY_BACKUP"
fi

# Cleanup old backups
echo "🧹 Cleaning up old backups..."

# Keep last 7 daily backups
if command -v ls >/dev/null 2>&1; then
    cd "$BACKUP_DIR/daily" && ls -t socc-*.db 2>/dev/null | tail -n +8 | xargs -r rm -f
    DAILY_COUNT=$(ls -1 socc-*.db 2>/dev/null | wc -l)
    echo "  Daily backups: $DAILY_COUNT"
fi

# Keep last 4 weekly backups
if [ -d "$BACKUP_DIR/weekly" ]; then
    cd "$BACKUP_DIR/weekly" && ls -t socc-*.db 2>/dev/null | tail -n +5 | xargs -r rm -f
    WEEKLY_COUNT=$(ls -1 socc-*.db 2>/dev/null | wc -l)
    echo "  Weekly backups: $WEEKLY_COUNT"
fi

# Keep last 12 monthly backups
if [ -d "$BACKUP_DIR/monthly" ]; then
    cd "$BACKUP_DIR/monthly" && ls -t socc-*.db 2>/dev/null | tail -n +13 | xargs -r rm -f
    MONTHLY_COUNT=$(ls -1 socc-*.db 2>/dev/null | wc -l)
    echo "  Monthly backups: $MONTHLY_COUNT"
fi

echo "✅ Backup complete"

# Optional: Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "📊 Total backup size: $TOTAL_SIZE"
