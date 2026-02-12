/**
 * SQLite migration system.
 * Each migration runs once, tracked in a migrations table.
 * Migrations initialize on first run and are idempotent.
 */

import type Database from 'better-sqlite3';

interface Migration {
  id: number;
  name: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    id: 1,
    name: 'create_threats_history',
    sql: `
      CREATE TABLE IF NOT EXISTS threats_history (
        id TEXT NOT NULL,
        cve_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        severity TEXT NOT NULL,
        cvss_score REAL,
        source TEXT,
        published_at TEXT NOT NULL,
        status TEXT NOT NULL,
        cisa_kev INTEGER DEFAULT 0,
        url TEXT,
        affected_vendors TEXT,
        ingested_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_threats_published ON threats_history(published_at);
      CREATE INDEX IF NOT EXISTS idx_threats_severity ON threats_history(severity);
      CREATE INDEX IF NOT EXISTS idx_threats_ingested ON threats_history(ingested_at);
    `,
  },
  {
    id: 2,
    name: 'create_news_history',
    sql: `
      CREATE TABLE IF NOT EXISTS news_history (
        id TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        source TEXT NOT NULL,
        url TEXT,
        published_at TEXT NOT NULL,
        category TEXT,
        sentiment TEXT,
        status TEXT NOT NULL DEFAULT 'new',
        ingested_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_news_published ON news_history(published_at);
      CREATE INDEX IF NOT EXISTS idx_news_source ON news_history(source);
      CREATE INDEX IF NOT EXISTS idx_news_ingested ON news_history(ingested_at);
    `,
  },
  {
    id: 3,
    name: 'create_stocks_history',
    sql: `
      CREATE TABLE IF NOT EXISTS stocks_history (
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        change_val REAL NOT NULL,
        change_percent REAL NOT NULL,
        recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks_history(symbol);
      CREATE INDEX IF NOT EXISTS idx_stocks_recorded ON stocks_history(recorded_at);
    `,
  },
  {
    id: 4,
    name: 'create_daily_counts',
    sql: `
      CREATE TABLE IF NOT EXISTS daily_counts (
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (date, type)
      );
    `,
  },
  {
    id: 5,
    name: 'create_briefings',
    sql: `
      CREATE TABLE IF NOT EXISTS briefings (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        content TEXT NOT NULL,
        highlights TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_briefings_date ON briefings(date);
      CREATE INDEX IF NOT EXISTS idx_briefings_created ON briefings(created_at);
    `,
  },
];

export function runMigrations(db: Database.Database): void {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    db.prepare('SELECT id FROM migrations').all().map((row) => (row as { id: number }).id)
  );

  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;

    console.log(`  🔄 Running migration #${migration.id}: ${migration.name}`);
    db.exec(migration.sql);
    db.prepare('INSERT INTO migrations (id, name) VALUES (?, ?)').run(migration.id, migration.name);
  }
}
