import { Router } from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../db/index.js';
import { ingestThreats } from '../db/ingest.js';
import { detectAnomaly } from '../anomaly.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

/** Current threats from JSON pipeline (+ ingest to SQLite) */
router.get('/', (_req, res) => {
  try {
    const data = JSON.parse(
      readFileSync(path.resolve(__dirname, '..', 'data', 'threats.json'), 'utf-8')
    );

    // Ingest into SQLite for historical tracking
    try {
      ingestThreats(data);
    } catch {
      // Non-fatal: SQLite write failure shouldn't break the API
    }

    // Check for anomalies
    const anomaly = detectAnomaly('threats');

    res.json({ data, anomaly });
  } catch {
    res.status(500).json({ error: 'Failed to read threats data' });
  }
});

/** Historical threat data from SQLite */
router.get('/history', (req, res) => {
  try {
    const days = Math.min(parseInt(String(req.query.days) || '30', 10), 365);
    const severity = req.query.severity as string | undefined;

    const db = getDb();
    let query = `
      SELECT id, cve_id, title, severity, cvss_score, source, published_at, status, cisa_kev, url
      FROM threats_history
      WHERE ingested_at >= datetime('now', ?)
    `;
    const params: (string | number)[] = [`-${days} days`];

    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }

    query += ' ORDER BY published_at DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to query threat history' });
  }
});

/** Daily threat counts for trend analysis */
router.get('/trends', (req, res) => {
  try {
    const days = Math.min(parseInt(String(req.query.days) || '30', 10), 365);
    const db = getDb();

    const rows = db.prepare(`
      SELECT date, count FROM daily_counts
      WHERE type = 'threats' AND date >= date('now', ?)
      ORDER BY date ASC
    `).all(`-${days} days`);

    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to query threat trends' });
  }
});

export default router;
