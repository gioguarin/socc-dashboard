import { Router } from 'express';
import { readDataFile } from '../utils.js';
import { sendSuccess, sendServerError } from '../utils/response.js';

const router = Router();

interface ThreatItem {
  title: string;
  severity: string;
  cvssScore: number | null;
  source: string;
  publishedAt: string;
  cisaKev: boolean;
  cveId: string | null;
}

interface NewsItem {
  title: string;
  source: string;
  publishedAt: string;
  category?: string;
}

interface Briefing {
  id: string;
  date: string;
  content: string;
  highlights: string[];
  createdAt: string;
}

/** Build a daily briefing from current threat + news data */
function generateBriefing(threats: ThreatItem[], news: NewsItem[]): Briefing {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;

  const recentThreats = threats
    .filter((t) => new Date(t.publishedAt).getTime() > oneDayAgo)
    .sort((a, b) => {
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5);
    });

  const recentNews = news
    .filter((n) => new Date(n.publishedAt).getTime() > oneDayAgo)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const kevItems = threats.filter((t) => t.cisaKev);
  const criticalCount = threats.filter((t) => t.severity === 'critical').length;
  const highCount = threats.filter((t) => t.severity === 'high').length;

  // Build highlights
  const highlights: string[] = [];
  highlights.push(`${threats.length} tracked threats (${criticalCount} critical, ${highCount} high)`);
  if (kevItems.length > 0) {
    highlights.push(`${kevItems.length} CISA KEV entries in feed`);
  }
  highlights.push(`${recentThreats.length} new threats in last 24h`);
  highlights.push(`${recentNews.length} news articles in last 24h`);
  highlights.push(`${news.length} total news items across all sources`);

  // Build markdown content
  const lines: string[] = [];
  lines.push(`## Daily Security Briefing — ${today}`);
  lines.push('');

  // Threat summary
  lines.push('### Threat Landscape');
  lines.push(`Tracking **${threats.length}** threats: **${criticalCount}** critical, **${highCount}** high severity.`);
  if (kevItems.length > 0) {
    lines.push(`**${kevItems.length}** items flagged in CISA Known Exploited Vulnerabilities catalog.`);
  }
  lines.push('');

  // Top threats
  if (recentThreats.length > 0) {
    lines.push('### Recent Threats');
    const topThreats = recentThreats.slice(0, 5);
    for (const t of topThreats) {
      const cvss = t.cvssScore ? ` (CVSS ${t.cvssScore})` : '';
      const cve = t.cveId ? ` — ${t.cveId}` : '';
      lines.push(`- **[${t.severity.toUpperCase()}]** ${t.title}${cvss}${cve}`);
    }
    if (recentThreats.length > 5) {
      lines.push(`- *...and ${recentThreats.length - 5} more*`);
    }
    lines.push('');
  }

  // News summary
  if (recentNews.length > 0) {
    lines.push('### Industry News');
    // Group by source
    const bySource = new Map<string, number>();
    for (const n of recentNews) {
      bySource.set(n.source, (bySource.get(n.source) || 0) + 1);
    }
    const sourceEntries = [...bySource.entries()].sort((a, b) => b[1] - a[1]);
    for (const [source, count] of sourceEntries.slice(0, 6)) {
      lines.push(`- **${source}**: ${count} article${count !== 1 ? 's' : ''}`);
    }
    lines.push('');

    // Top headlines
    lines.push('### Top Headlines');
    for (const n of recentNews.slice(0, 5)) {
      lines.push(`- ${n.title} *(${n.source})*`);
    }
    lines.push('');
  }

  return {
    id: `briefing-${today}`,
    date: today,
    content: lines.join('\n'),
    highlights,
    createdAt: now.toISOString(),
  };
}

/**
 * @swagger
 * /api/briefings:
 *   get:
 *     summary: Get morning briefings
 *     description: Returns daily security briefings with highlights
 *     tags: [Briefings]
 *     responses:
 *       200:
 *         description: Briefing data
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
 *                     $ref: '#/components/schemas/Briefing'
 *       500:
 *         description: Server error
 */
router.get('/', (_req, res) => {
  try {
    const saved = readDataFile<Briefing[]>('briefings.json', []);

    // Auto-generate a briefing from current data if none exist
    if (saved.length === 0) {
      const threats = readDataFile<ThreatItem[]>('threats.json', []);
      const news = readDataFile<NewsItem[]>('news.json', []);
      const generated = generateBriefing(threats, news);
      sendSuccess(res, [generated]);
      return;
    }

    sendSuccess(res, saved);
  } catch {
    sendServerError(res, 'Failed to read briefings data');
  }
});

export default router;
