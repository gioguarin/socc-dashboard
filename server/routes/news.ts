import { Router } from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ingestNews } from '../db/ingest.js';
import { detectAnomaly } from '../anomaly.js';
import { getDb } from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

/** Current news from JSON pipeline (+ ingest to SQLite) */
router.get('/', (_req, res) => {
  try {
    const data = JSON.parse(
      readFileSync(path.resolve(__dirname, '..', 'data', 'news.json'), 'utf-8')
    );

    // Ingest into SQLite for historical tracking
    try {
      ingestNews(data);
    } catch {
      // Non-fatal: SQLite write failure shouldn't break the API
    }

    // Check for anomalies
    const anomaly = detectAnomaly('news');

    res.json({ data, anomaly });
  } catch {
    res.status(500).json({ error: 'Failed to read news data' });
  }
});

/** Historical news data from SQLite */
router.get('/history', (req, res) => {
  try {
    const days = Math.min(parseInt(String(req.query.days) || '30', 10), 365);
    const source = req.query.source as string | undefined;

    const db = getDb();
    let query = `
      SELECT id, title, summary, source, url, published_at, category, sentiment, status
      FROM news_history
      WHERE ingested_at >= datetime('now', ?)
    `;
    const params: (string | number)[] = [`-${days} days`];

    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }

    query += ' ORDER BY published_at DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to query news history' });
  }
});

export default router;
