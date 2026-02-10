import { Router } from 'express';
import { readDataFile } from '../utils.js';
import { getDb } from '../db/index.js';
import { ingestThreats } from '../db/ingest.js';
import { detectAnomaly } from '../anomaly.js';
import { sendSuccess, sendServerError } from '../utils/response.js';

const router = Router();

/**
 * @swagger
 * /api/threats:
 *   get:
 *     summary: Get current threat intelligence
 *     description: Returns CVE/vulnerability data from CISA KEV and other sources. Anomaly detection included.
 *     tags: [Threats]
 *     responses:
 *       200:
 *         description: Threat data with optional anomaly alert
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
 *                     $ref: '#/components/schemas/ThreatItem'
 *                 anomaly:
 *                   $ref: '#/components/schemas/Anomaly'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', (_req, res) => {
  try {
    const data = readDataFile('threats.json', []);

    // Ingest into SQLite for historical tracking
    try {
      ingestThreats(data);
    } catch {
      // Non-fatal: SQLite write failure shouldn't break the API
    }

    // Check for anomalies
    const anomaly = detectAnomaly('threats');

    sendSuccess(res, data, { anomaly });
  } catch {
    sendServerError(res, 'Failed to read threats data');
  }
});

/**
 * @swagger
 * /api/threats/history:
 *   get:
 *     summary: Get historical threat data
 *     description: Query historical CVE data from SQLite with optional severity filter
 *     tags: [Threats]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *           maximum: 365
 *         description: Number of days of history to return
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [critical, high, medium, low, info]
 *         description: Filter by severity level
 *     responses:
 *       200:
 *         description: Historical threat data
 *       500:
 *         description: Server error
 */
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
    sendSuccess(res, rows, { meta: { count: rows.length, days } });
  } catch {
    sendServerError(res, 'Failed to query threat history');
  }
});

/**
 * @swagger
 * /api/threats/trends:
 *   get:
 *     summary: Get threat volume trends
 *     description: Daily threat counts for sparkline/trend analysis
 *     tags: [Threats]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *           maximum: 365
 *         description: Number of days of trend data
 *     responses:
 *       200:
 *         description: Daily threat counts
 *       500:
 *         description: Server error
 */
router.get('/trends', (req, res) => {
  try {
    const days = Math.min(parseInt(String(req.query.days) || '30', 10), 365);
    const db = getDb();

    const rows = db.prepare(`
      SELECT date, count FROM daily_counts
      WHERE type = 'threats' AND date >= date('now', ?)
      ORDER BY date ASC
    `).all(`-${days} days`);

    sendSuccess(res, rows, { meta: { count: rows.length, days } });
  } catch {
    sendServerError(res, 'Failed to query threat trends');
  }
});

export default router;
