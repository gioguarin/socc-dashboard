# SOCC Dashboard Database Documentation

## Overview

The SOCC Dashboard uses SQLite for historical data storage and trend analysis. The database runs in WAL (Write-Ahead Logging) mode for better concurrent read performance.

## Database Location

```
server/data/socc.db          # Main database file
server/data/socc.db-wal      # Write-Ahead Log
server/data/socc.db-shm      # Shared memory file
```

All database files are in `.gitignore` and generated at runtime.

## Schema

### migrations
Tracks applied database migrations.

```sql
CREATE TABLE migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### threats_history
Historical CVE and vulnerability data for trend analysis.

```sql
CREATE TABLE threats_history (
  id TEXT PRIMARY KEY,
  cve_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL,
  cvss_score REAL,
  source TEXT NOT NULL,
  published_at TEXT NOT NULL,
  affected_products TEXT,      -- JSON array
  patch_urls TEXT,             -- JSON array
  affected_vendors TEXT,       -- JSON array
  status TEXT NOT NULL,
  cisa_kev INTEGER NOT NULL,
  url TEXT,
  ingested_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_threats_severity ON threats_history(severity);
CREATE INDEX idx_threats_published ON threats_history(published_at);
CREATE INDEX idx_threats_ingested ON threats_history(ingested_at);
```

**Key Points:**
- `cisa_kev` stored as INTEGER (0/1) for boolean
- JSON arrays stored as TEXT (SQLite doesn't have native JSON arrays)
- Indexed on severity, published_at, and ingested_at for fast queries

### news_history
Historical news items for aggregation and sentiment tracking.

```sql
CREATE TABLE news_history (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  sentiment TEXT,
  tldr TEXT,
  ingested_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_news_source ON news_history(source);
CREATE INDEX idx_news_published ON news_history(published_at);
CREATE INDEX idx_news_sentiment ON news_history(sentiment);
CREATE INDEX idx_news_ingested ON news_history(ingested_at);
```

**Key Points:**
- Indexed on source, published_at, sentiment, and ingested_at
- Supports sentiment analysis queries

### stocks_history
Historical stock price data for sparkline generation.

```sql
CREATE TABLE stocks_history (
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  change_amount REAL NOT NULL,
  change_percent REAL NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (symbol, recorded_at)
);

CREATE INDEX idx_stocks_symbol ON stocks_history(symbol);
CREATE INDEX idx_stocks_recorded ON stocks_history(recorded_at);
```

**Key Points:**
- Composite primary key (symbol + recorded_at)
- Enables 30-day sparkline queries

### daily_counts
Aggregated daily statistics for anomaly detection.

```sql
CREATE TABLE daily_counts (
  date TEXT PRIMARY KEY,
  threat_count INTEGER NOT NULL DEFAULT 0,
  news_count INTEGER NOT NULL DEFAULT 0,
  high_severity_count INTEGER NOT NULL DEFAULT 0,
  critical_severity_count INTEGER NOT NULL DEFAULT 0
);
```

**Key Points:**
- One row per day
- Used for volume spike detection

## WAL Mode

The database runs in Write-Ahead Logging mode:

```javascript
db.pragma('journal_mode = WAL');
```

**Benefits:**
- Better concurrent read performance
- Writers don't block readers
- Crash recovery

**Files:**
- `socc.db-wal`: Transaction log (auto-managed)
- `socc.db-shm`: Shared memory index (auto-managed)

**Checkpoints:**
SQLite automatically checkpoints WAL data back to the main database. No manual management needed.

## Backup Strategy

### Manual Backup

**Option 1: Simple File Copy (Server Must Be Stopped)**

```bash
# Stop the server
npm stop

# Copy database files
cp server/data/socc.db server/data/backups/socc-$(date +%Y%m%d).db

# Restart server
npm start
```

**Option 2: SQLite Backup Command (Server Can Run)**

```bash
sqlite3 server/data/socc.db ".backup server/data/backups/socc-$(date +%Y%m%d).db"
```

This method is safe while the server is running because SQLite handles locking.

**Option 3: Using the Backup Script**

```bash
./scripts/backup-db.sh
```

### Automated Backups

**Cron Job (Daily at 2 AM)**

```cron
0 2 * * * /path/to/socc-dashboard/scripts/backup-db.sh
```

**Systemd Timer (Daily at 2 AM)**

Create `/etc/systemd/system/socc-backup.timer`:

```ini
[Unit]
Description=SOCC Dashboard Database Backup

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

Create `/etc/systemd/system/socc-backup.service`:

```ini
[Unit]
Description=SOCC Dashboard Database Backup

[Service]
Type=oneshot
ExecStart=/path/to/socc-dashboard/scripts/backup-db.sh
User=socc
```

Enable:
```bash
sudo systemctl enable socc-backup.timer
sudo systemctl start socc-backup.timer
```

### Backup Retention

The backup script automatically manages retention:
- Keeps last 7 daily backups
- Keeps last 4 weekly backups (Sundays)
- Keeps last 12 monthly backups (1st of month)

### Cloud Backup

**Option 1: AWS S3**

```bash
aws s3 cp server/data/socc.db s3://your-bucket/backups/socc-$(date +%Y%m%d).db
```

**Option 2: rsync to Remote Server**

```bash
rsync -avz server/data/socc.db user@backup-server:/backups/socc/
```

## Restore

### From Backup

1. Stop the server:
   ```bash
   npm stop
   ```

2. Replace the database file:
   ```bash
   cp server/data/backups/socc-YYYYMMDD.db server/data/socc.db
   ```

3. Remove WAL files (they'll be regenerated):
   ```bash
   rm -f server/data/socc.db-wal server/data/socc.db-shm
   ```

4. Restart the server:
   ```bash
   npm start
   ```

### Verify Backup Integrity

```bash
sqlite3 server/data/backups/socc-YYYYMMDD.db "PRAGMA integrity_check;"
```

Should return: `ok`

## Maintenance

### Vacuum (Reclaim Space)

```bash
sqlite3 server/data/socc.db "VACUUM;"
```

Run monthly or when database size grows significantly.

### Analyze (Update Query Planner Statistics)

```bash
sqlite3 server/data/socc.db "ANALYZE;"
```

Run after large data imports or schema changes.

### Check Database Size

```bash
du -h server/data/socc.db
```

### WAL Checkpoint (Force Write to Main DB)

```bash
sqlite3 server/data/socc.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

This is rarely needed as SQLite handles checkpoints automatically.

## Monitoring

### Query Performance

Enable query logging in development:

```javascript
db.on('query', (query) => {
  console.log('Query:', query);
});
```

### Database Metrics

Check daily counts:

```sql
SELECT * FROM daily_counts ORDER BY date DESC LIMIT 7;
```

Check total records:

```sql
SELECT
  (SELECT COUNT(*) FROM threats_history) as threats,
  (SELECT COUNT(*) FROM news_history) as news,
  (SELECT COUNT(*) FROM stocks_history) as stocks;
```

## Troubleshooting

### Database Locked Error

**Cause:** Another process has an exclusive lock.

**Solution:**
1. Check for multiple server instances
2. Wait for WAL checkpoint to complete
3. Restart the server

### Corrupted Database

**Symptoms:** Integrity check fails, crashes on queries

**Recovery:**
1. Restore from backup (see Restore section)
2. If no backup, try recovery:
   ```bash
   sqlite3 server/data/socc.db ".recover" | sqlite3 server/data/socc-recovered.db
   ```

### WAL File Growing Large

**Cause:** Infrequent checkpoints with heavy writes

**Solution:**
```bash
sqlite3 server/data/socc.db "PRAGMA wal_checkpoint(RESTART);"
```

This forces a checkpoint and resets the WAL.

## Data Retention

By default, all historical data is kept indefinitely. To implement data retention:

### Delete Old Records (Example: 90 Days)

```sql
DELETE FROM threats_history
WHERE ingested_at < datetime('now', '-90 days');

DELETE FROM news_history
WHERE ingested_at < datetime('now', '-90 days');

DELETE FROM stocks_history
WHERE recorded_at < datetime('now', '-90 days');

VACUUM;
```

Consider adding this to a monthly maintenance script.

## Security

- Database files are in `.gitignore` (never committed)
- No passwords stored in database (auth uses env vars)
- SQLite doesn't have network access (local file only)
- File permissions should be restricted:
  ```bash
  chmod 600 server/data/socc.db
  ```

## Migration Management

Migrations are tracked in the `migrations` table. To add a new migration:

1. Increment the version number
2. Add migration SQL to `server/db/migrations.ts`
3. Run the server (migrations apply automatically on startup)

Example:

```typescript
const migrations = [
  // ... existing migrations
  {
    version: 3,
    sql: `
      CREATE TABLE new_table (
        id TEXT PRIMARY KEY,
        data TEXT
      );
    `,
  },
];
```

## Performance Tips

1. **Use Indexes:** All frequently queried columns are indexed
2. **Batch Inserts:** Use transactions for bulk operations
3. **WAL Mode:** Enabled by default for better concurrency
4. **Prepared Statements:** Used throughout (via better-sqlite3)
5. **Connection Pooling:** Single connection reused (synchronous driver)

## Tools

### SQLite CLI

```bash
# Open database
sqlite3 server/data/socc.db

# List tables
.tables

# Show schema
.schema threats_history

# Run query
SELECT COUNT(*) FROM threats_history WHERE severity='critical';

# Export to CSV
.mode csv
.output threats.csv
SELECT * FROM threats_history;
.quit
```

### DB Browser for SQLite

GUI tool for browsing and editing SQLite databases:
https://sqlitebrowser.org/

## References

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [WAL Mode](https://www.sqlite.org/wal.html)
- [SQLite Backup API](https://www.sqlite.org/backup.html)
