/**
 * Data ingestion — writes pipeline data to SQLite.
 * Called alongside JSON file reads to build historical data over time.
 * Uses INSERT OR IGNORE to avoid duplicates on repeated ingestion.
 */

import type Database from 'better-sqlite3';
import { getDb } from './index.js';

interface ThreatRow {
  id: string;
  cveId?: string;
  title: string;
  description: string;
  severity: string;
  cvssScore?: number;
  source: string;
  publishedAt: string;
  status: string;
  cisaKev: boolean;
  url?: string;
  affectedVendors?: string[];
}

interface NewsRow {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  sentiment?: string;
  status: string;
}

interface StockRow {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

/** Ingest threat data into SQLite history */
export function ingestThreats(threats: ThreatRow[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO threats_history
      (id, cve_id, title, description, severity, cvss_score, source, published_at, status, cisa_kev, url, affected_vendors)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: ThreatRow[]) => {
    for (const t of items) {
      stmt.run(
        t.id,
        t.cveId ?? null,
        t.title,
        t.description,
        t.severity,
        t.cvssScore ?? null,
        t.source,
        t.publishedAt,
        t.status,
        t.cisaKev ? 1 : 0,
        t.url ?? null,
        t.affectedVendors ? JSON.stringify(t.affectedVendors) : null,
      );
    }
  });

  insertMany(threats);
  updateDailyCount(db, 'threats', threats.length);
}

/** Ingest news data into SQLite history */
export function ingestNews(news: NewsRow[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO news_history
      (id, title, summary, source, url, published_at, category, sentiment, status)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: NewsRow[]) => {
    for (const n of items) {
      stmt.run(
        n.id, n.title, n.summary, n.source, n.url,
        n.publishedAt, n.category, n.sentiment ?? null, n.status,
      );
    }
  });

  insertMany(news);
  updateDailyCount(db, 'news', news.length);
}

/** Ingest stock snapshot into SQLite history */
export function ingestStocks(stocks: StockRow[]): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO stocks_history (symbol, name, price, change_val, change_percent)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: StockRow[]) => {
    for (const s of items) {
      stmt.run(s.symbol, s.name, s.price, s.change, s.changePercent);
    }
  });

  insertMany(stocks);
}

/** Update daily count tracker (used for anomaly detection) */
function updateDailyCount(db: Database.Database, type: string, count: number): void {
  const today = new Date().toISOString().split('T')[0];
  db.prepare(`
    INSERT INTO daily_counts (date, type, count) VALUES (?, ?, ?)
    ON CONFLICT(date, type) DO UPDATE SET count = count + excluded.count
  `).run(today, type, count);
}
