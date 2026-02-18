import { Router } from 'express';
import { readDataFile } from '../utils.js';
import { ingestStocks } from '../db/ingest.js';
import { getDb } from '../db/index.js';
import { sendSuccess, sendServerError } from '../utils/response.js';

const router = Router();

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

const STOCK_NAMES: Record<string, string> = {
  AKAM: 'Akamai Technologies',
  NET: 'Cloudflare',
  FSLY: 'Fastly',
  ZS: 'Zscaler',
  CRWD: 'CrowdStrike',
  PANW: 'Palo Alto Networks',
  FFIV: 'F5',
};

// Valid Yahoo Finance range values
const VALID_RANGES = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'] as const;
type YahooRange = typeof VALID_RANGES[number];

interface EarningsInfo {
  lastEarningsDate: string | null;
  nextEarningsDate: string | null;
  lastEarningsEps: number | null;
  lastEarningsRevenue: number | null;
}

interface StockDetailResponse {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  range: string;
  sparkline: number[];
  timestamps: number[];
  high52w: number | null;
  low52w: number | null;
  marketCap: number | null;
  volume: number | null;
  avgVolume: number | null;
  earnings: EarningsInfo;
  lastUpdated: string;
}

async function fetchYahooChart(symbol: string, range: YahooRange): Promise<unknown> {
  // Use appropriate interval based on range
  let interval = '1d';
  if (range === '1d') interval = '5m';
  else if (range === '5d') interval = '15m';

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
  const resp = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!resp.ok) throw new Error(`Yahoo API error: ${resp.status}`);
  return resp.json();
}

async function fetchYahooQuoteSummary(symbol: string): Promise<unknown | null> {
  // v10 quoteSummary often requires cookies/auth, try v7 first
  const modules = 'price,summaryDetail,calendarEvents,earningsHistory';
  const urls = [
    `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules}`,
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules}`,
  ];

  for (const url of urls) {
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'application/json',
        },
      });
      if (resp.ok) return resp.json();
    } catch {
      // Try next URL
    }
  }
  // Return null instead of throwing - earnings are optional
  return null;
}

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

/**
 * @swagger
 * /api/stocks/{symbol}:
 *   get:
 *     summary: Get detailed stock data with historical range
 *     description: Fetch real-time stock data from Yahoo Finance with configurable time range and earnings info
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Stock symbol (e.g., AKAM, NET)
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max]
 *           default: 1mo
 *         description: Time range for historical data
 *     responses:
 *       200:
 *         description: Detailed stock data with chart and earnings
 *       400:
 *         description: Invalid symbol or range
 *       500:
 *         description: Failed to fetch from Yahoo Finance
 */
router.get('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const range = (req.query.range as YahooRange) || '1mo';

    if (!VALID_RANGES.includes(range)) {
      res.status(400).json({ success: false, error: `Invalid range. Valid: ${VALID_RANGES.join(', ')}` });
      return;
    }

    // Fetch chart data (required) and quote summary (optional) in parallel
    const [chartData, summaryData] = await Promise.all([
      fetchYahooChart(symbol, range),
      fetchYahooQuoteSummary(symbol).catch(() => null),
    ]);

    // Parse chart data
    const chart = (chartData as { chart?: { result?: Array<{ meta?: unknown; indicators?: { quote?: Array<{ close?: number[] }> }; timestamp?: number[] }> } })?.chart?.result?.[0];
    if (!chart) {
      res.status(400).json({ success: false, error: 'Symbol not found' });
      return;
    }

    const meta = chart.meta as Record<string, unknown> || {};
    const price = (meta.regularMarketPrice as number) || 0;
    const prevClose = (meta.chartPreviousClose as number) || price;
    const change = Math.round((price - prevClose) * 100) / 100;
    const changePercent = prevClose ? Math.round((change / prevClose) * 10000) / 100 : 0;

    // Extract 52-week range from chart meta (more reliable than quoteSummary)
    const high52wMeta = (meta.fiftyTwoWeekHigh as number) || null;
    const low52wMeta = (meta.fiftyTwoWeekLow as number) || null;
    const volume = (meta.regularMarketVolume as number) || null;

    const closes = chart.indicators?.quote?.[0]?.close || [];
    const timestamps = chart.timestamp || [];
    const sparkline = closes.filter((c): c is number => c !== null).map((c) => Math.round(c * 100) / 100);

    // Parse quote summary for earnings (may be null if API auth fails)
    const summary = summaryData
      ? (summaryData as { quoteSummary?: { result?: Array<{ price?: unknown; summaryDetail?: unknown; calendarEvents?: unknown; earningsHistory?: unknown }> } })?.quoteSummary?.result?.[0]
      : null;
    const priceInfo = (summary?.price || {}) as Record<string, { raw?: number }>;
    const summaryDetail = (summary?.summaryDetail || {}) as Record<string, { raw?: number }>;
    const calendarEvents = (summary?.calendarEvents || {}) as { earnings?: { earningsDate?: Array<{ raw?: number }>; earningsAverage?: { raw?: number } } };
    const earningsHistory = (summary?.earningsHistory || {}) as { history?: Array<{ epsActual?: { raw?: number }; surprisePercent?: { raw?: number }; quarter?: { raw?: number } }> };

    // Extract earnings info
    const earningsDates = calendarEvents?.earnings?.earningsDate || [];
    const nextEarningsTimestamp = earningsDates[0]?.raw;
    const nextEarningsDate = nextEarningsTimestamp
      ? new Date(nextEarningsTimestamp * 1000).toISOString().split('T')[0]
      : null;

    // Last earnings from history
    const lastEarnings = earningsHistory?.history?.[0];
    const lastEarningsQuarter = lastEarnings?.quarter?.raw;
    const lastEarningsDate = lastEarningsQuarter
      ? new Date(lastEarningsQuarter * 1000).toISOString().split('T')[0]
      : null;
    const lastEarningsEps = lastEarnings?.epsActual?.raw ?? null;

    const response: StockDetailResponse = {
      symbol,
      name: STOCK_NAMES[symbol] || symbol,
      price,
      change,
      changePercent,
      range,
      sparkline,
      timestamps,
      high52w: summaryDetail.fiftyTwoWeekHigh?.raw ?? high52wMeta,
      low52w: summaryDetail.fiftyTwoWeekLow?.raw ?? low52wMeta,
      marketCap: priceInfo.marketCap?.raw ?? null,
      volume: summaryDetail.volume?.raw ?? volume,
      avgVolume: summaryDetail.averageVolume?.raw ?? null,
      earnings: {
        lastEarningsDate,
        nextEarningsDate,
        lastEarningsEps,
        lastEarningsRevenue: null, // Would need financials module
      },
      lastUpdated: new Date().toISOString(),
    };

    sendSuccess(res, response);
  } catch (err) {
    console.error('Stock detail fetch error:', err);
    sendServerError(res, 'Failed to fetch stock data');
  }
});

/**
 * @swagger
 * /api/stocks/batch:
 *   post:
 *     summary: Get detailed data for multiple stocks
 *     description: Fetch real-time data for multiple symbols with the same range
 *     tags: [Stocks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symbols:
 *                 type: array
 *                 items:
 *                   type: string
 *               range:
 *                 type: string
 *                 enum: [1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max]
 *     responses:
 *       200:
 *         description: Array of detailed stock data
 */
router.post('/batch', async (req, res) => {
  try {
    const { symbols, range = '1mo' } = req.body as { symbols?: string[]; range?: YahooRange };

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      res.status(400).json({ success: false, error: 'symbols array required' });
      return;
    }

    if (!VALID_RANGES.includes(range)) {
      res.status(400).json({ success: false, error: `Invalid range. Valid: ${VALID_RANGES.join(', ')}` });
      return;
    }

    // Fetch all symbols in parallel (limit to 10)
    const limitedSymbols = symbols.slice(0, 10).map((s) => s.toUpperCase());

    const results = await Promise.all(
      limitedSymbols.map(async (symbol) => {
        try {
          const [chartData, summaryData] = await Promise.all([
            fetchYahooChart(symbol, range),
            fetchYahooQuoteSummary(symbol).catch(() => null),
          ]);

          const chart = (chartData as { chart?: { result?: Array<{ meta?: unknown; indicators?: { quote?: Array<{ close?: number[] }> }; timestamp?: number[] }> } })?.chart?.result?.[0];
          if (!chart) return null;

          const meta = chart.meta as Record<string, unknown> || {};
          const price = (meta.regularMarketPrice as number) || 0;
          const prevClose = (meta.chartPreviousClose as number) || price;
          const change = Math.round((price - prevClose) * 100) / 100;
          const changePercent = prevClose ? Math.round((change / prevClose) * 10000) / 100 : 0;

          // Extract 52-week range from chart meta
          const high52wMeta = (meta.fiftyTwoWeekHigh as number) || null;
          const low52wMeta = (meta.fiftyTwoWeekLow as number) || null;
          const volumeMeta = (meta.regularMarketVolume as number) || null;

          const closes = chart.indicators?.quote?.[0]?.close || [];
          const timestamps = chart.timestamp || [];
          const sparkline = closes.filter((c): c is number => c !== null).map((c) => Math.round(c * 100) / 100);

          const summary = summaryData
            ? (summaryData as { quoteSummary?: { result?: Array<{ price?: unknown; summaryDetail?: unknown; calendarEvents?: unknown; earningsHistory?: unknown }> } })?.quoteSummary?.result?.[0]
            : null;
          const priceInfo = (summary?.price || {}) as Record<string, { raw?: number }>;
          const summaryDetail = (summary?.summaryDetail || {}) as Record<string, { raw?: number }>;
          const calendarEvents = (summary?.calendarEvents || {}) as { earnings?: { earningsDate?: Array<{ raw?: number }> } };
          const earningsHistory = (summary?.earningsHistory || {}) as { history?: Array<{ epsActual?: { raw?: number }; quarter?: { raw?: number } }> };

          const earningsDates = calendarEvents?.earnings?.earningsDate || [];
          const nextEarningsTimestamp = earningsDates[0]?.raw;
          const nextEarningsDate = nextEarningsTimestamp
            ? new Date(nextEarningsTimestamp * 1000).toISOString().split('T')[0]
            : null;

          const lastEarnings = earningsHistory?.history?.[0];
          const lastEarningsQuarter = lastEarnings?.quarter?.raw;
          const lastEarningsDate = lastEarningsQuarter
            ? new Date(lastEarningsQuarter * 1000).toISOString().split('T')[0]
            : null;

          return {
            symbol,
            name: STOCK_NAMES[symbol] || symbol,
            price,
            change,
            changePercent,
            range,
            sparkline,
            timestamps,
            high52w: summaryDetail.fiftyTwoWeekHigh?.raw ?? high52wMeta,
            low52w: summaryDetail.fiftyTwoWeekLow?.raw ?? low52wMeta,
            marketCap: priceInfo.marketCap?.raw ?? null,
            volume: summaryDetail.volume?.raw ?? volumeMeta,
            avgVolume: summaryDetail.averageVolume?.raw ?? null,
            earnings: {
              lastEarningsDate,
              nextEarningsDate,
              lastEarningsEps: lastEarnings?.epsActual?.raw ?? null,
              lastEarningsRevenue: null,
            },
            lastUpdated: new Date().toISOString(),
          };
        } catch {
          return null;
        }
      })
    );

    sendSuccess(res, results.filter(Boolean));
  } catch (err) {
    console.error('Batch stock fetch error:', err);
    sendServerError(res, 'Failed to fetch stock data');
  }
});

export default router;
