import { Router } from 'express';
import { readDataFile } from '../utils.js';
import { ingestStocks } from '../db/ingest.js';
import { getDb } from '../db/index.js';
import { sendSuccess, sendServerError } from '../utils/response.js';

const router = Router();

/**
 * @swagger
 * /api/stocks:
 *   get:
 *     summary: Get current stock prices
 *     description: Returns latest stock data for tracked security/CDN companies
 *     tags: [Stocks]
 *     responses:
 *       200:
 *         description: Stock price data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StockData'
 *       500:
 *         description: Server error
 */
router.get('/', (_req, res) => {
  try {
    const data = readDataFile('stocks.json', []);

    // Ingest into SQLite for historical tracking
    try {
      ingestStocks(data);
    } catch {
      // Non-fatal: SQLite write failure shouldn't break the API
    }

    sendSuccess(res, data);
  } catch {
    sendServerError(res, 'Failed to read stocks data');
  }
});

/**
 * @swagger
 * /api/stocks/history:
 *   get:
 *     summary: Get historical stock data
 *     description: Query historical stock prices from SQLite with optional symbol filter
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 90
 *           maximum: 365
 *         description: Number of days of history to return
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         description: Filter by stock symbol (e.g., AKAM, NET, FSLY)
 *     responses:
 *       200:
 *         description: Historical stock data
 *       500:
 *         description: Server error
 */
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
    sendSuccess(res, rows, { meta: { count: rows.length, days } });
  } catch {
    sendServerError(res, 'Failed to query stock history');
  }
});

export default router;
