import { Router } from 'express';
import { readDataFile } from '../utils.js';
import { ingestStocks } from '../db/ingest.js';
import { getDb } from '../db/index.js';

const router = Router();

/** Current stock data from JSON pipeline (+ ingest to SQLite) */
router.get('/', (_req, res) => {
  try {
    const data = readDataFile('stocks.json', []);

    // Ingest into SQLite for historical tracking
    try {
      ingestStocks(data);
    } catch {
      // Non-fatal: SQLite write failure shouldn't break the API
    }

    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to read stocks data' });
  }
});

/** Historical stock data from SQLite */
router.get('/history', (req, res) => {
  try {
    const days = Math.min(parseInt(String(req.query.days) || '90', 10), 365);
    const symbol = req.query.symbol as string | undefined;

    const db = getDb();
    let query = `
      SELECT symbol, name, price, change_val, change_percent, recorded_at
      FROM stocks_history
      WHERE recorded_at >= datetime('now', ?)
    `;
    const params: (string | number)[] = [`-${days} days`];

    if (symbol) {
      query += ' AND symbol = ?';
      params.push(symbol.toUpperCase());
    }

    query += ' ORDER BY recorded_at DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Failed to query stock history' });
  }
});

export default router;
