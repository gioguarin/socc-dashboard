/**
 * SQLite persistence for briefings.
 * Follows the same pattern as server/db/ingest.ts.
 */

import { getDb } from '../db/index.js';

export interface StoredBriefing {
  id: string;
  date: string;
  content: string;
  highlights: string[];
  createdAt: string;
}

interface BriefingRow {
  id: string;
  date: string;
  content: string;
  highlights: string;
  created_at: string;
}

/** Save a briefing to SQLite (upsert) */
export function saveBriefing(briefing: StoredBriefing): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO briefings (id, date, content, highlights, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    briefing.id,
    briefing.date,
    briefing.content,
    JSON.stringify(briefing.highlights),
    briefing.createdAt,
  );
}

/** Get all briefings, most recent first */
export function getAllBriefings(limit = 50): StoredBriefing[] {
  const db = getDb();
  const rows = db.prepare(
    'SELECT * FROM briefings ORDER BY created_at DESC LIMIT ?',
  ).all(limit) as BriefingRow[];

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    content: row.content,
    highlights: JSON.parse(row.highlights) as string[],
    createdAt: row.created_at,
  }));
}
