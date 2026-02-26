import { Router } from 'express';
import { readDataFile, writeDataFile } from '../utils.js';
import { ingestNews } from '../db/ingest.js';
import { detectAnomaly } from '../anomaly.js';
import { getDb } from '../db/index.js';
import { sendSuccess, sendBadRequest, sendServerError } from '../utils/response.js';
import { enrichArticle } from '../enrichment/summarizer.js';

const router = Router();

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get current news feed
 *     description: Returns aggregated security/industry news from tracked vendors. Anomaly detection included.
 *     tags: [News]
 *     responses:
 *       200:
 *         description: News data with optional anomaly alert
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
 *                     $ref: '#/components/schemas/NewsItem'
 *                 anomaly:
 *                   $ref: '#/components/schemas/Anomaly'
 *       500:
 *         description: Server error
 */
router.get('/', (_req, res) => {
  try {
    const raw = readDataFile('news.json', []);

    // Deduplicate by title (keep first = most recent)
    const seenTitles = new Set<string>();
    const data = raw.filter((item: { title?: string }) => {
      const key = (item.title ?? '').trim().toLowerCase();
      if (!key || seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    });

    // Ingest into SQLite for historical tracking
    try {
      ingestNews(data);
    } catch {
      // Non-fatal: SQLite write failure shouldn't break the API
    }

    // Check for anomalies
    const anomaly = detectAnomaly('news');

    sendSuccess(res, data, { anomaly });
  } catch {
    sendServerError(res, 'Failed to read news data');
  }
});

/**
 * @swagger
 * /api/news/history:
 *   get:
 *     summary: Get historical news data
 *     description: Query historical news from SQLite with optional source filter
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *           maximum: 365
 *         description: Number of days of history to return
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [akamai, cloudflare, fastly, zscaler, crowdstrike, paloalto, f5, general]
 *         description: Filter by news source
 *     responses:
 *       200:
 *         description: Historical news data
 *       500:
 *         description: Server error
 */
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
    sendSuccess(res, rows, { meta: { count: rows.length, days } });
  } catch {
    sendServerError(res, 'Failed to query news history');
  }
});

/** POST /api/news/enrich — Fetch and summarize an article */
router.post('/enrich', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      sendBadRequest(res, 'Missing article id');
      return;
    }

    const news = readDataFile('news.json', []);
    const article = news.find((item: { id: string }) => item.id === id);
    if (!article) {
      sendBadRequest(res, 'Article not found');
      return;
    }

    if (article.tldr) {
      sendSuccess(res, { id, tldr: article.tldr, cached: true });
      return;
    }

    const result = await enrichArticle(article.url, article.title, article.source);

    // Write back to news.json
    article.tldr = result.tldr;
    if (result.sentiment) article.sentiment = result.sentiment;
    writeDataFile('news.json', news);

    sendSuccess(res, { id, tldr: result.tldr, sentiment: result.sentiment });
  } catch {
    sendServerError(res, 'Failed to enrich article');
  }
});

export default router;
