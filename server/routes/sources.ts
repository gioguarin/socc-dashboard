import { Router } from 'express';
import { readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

/** Known RSS/data sources used by the pipeline scripts */
const SOURCES = [
  {
    id: 'cisa-kev',
    name: 'CISA KEV Catalog',
    url: 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
    type: 'threat' as const,
    enabled: true,
  },
  {
    id: 'hacker-news',
    name: 'The Hacker News',
    url: 'https://feeds.feedburner.com/TheHackersNews',
    type: 'threat' as const,
    enabled: true,
  },
  {
    id: 'google-akamai',
    name: 'Google News — Akamai',
    url: 'https://news.google.com/rss/search?q=%22Akamai%22+when:7d',
    type: 'news' as const,
    enabled: true,
  },
  {
    id: 'google-cloudflare',
    name: 'Google News — Cloudflare',
    url: 'https://news.google.com/rss/search?q=%22Cloudflare%22+when:7d',
    type: 'news' as const,
    enabled: true,
  },
  {
    id: 'google-fastly',
    name: 'Google News — Fastly',
    url: 'https://news.google.com/rss/search?q=%22Fastly%22+when:7d',
    type: 'news' as const,
    enabled: true,
  },
  {
    id: 'google-zscaler',
    name: 'Google News — Zscaler',
    url: 'https://news.google.com/rss/search?q=%22Zscaler%22+when:7d',
    type: 'news' as const,
    enabled: true,
  },
  {
    id: 'google-crowdstrike',
    name: 'Google News — CrowdStrike',
    url: 'https://news.google.com/rss/search?q=%22CrowdStrike%22+when:7d',
    type: 'news' as const,
    enabled: true,
  },
  {
    id: 'google-paloalto',
    name: 'Google News — Palo Alto Networks',
    url: 'https://news.google.com/rss/search?q=%22Palo+Alto+Networks%22+when:7d',
    type: 'news' as const,
    enabled: true,
  },
  {
    id: 'google-f5',
    name: 'Google News — F5',
    url: 'https://news.google.com/rss/search?q=%22F5+Networks%22+OR+%22F5+Inc%22+when:7d',
    type: 'news' as const,
    enabled: true,
  },
  {
    id: 'akamai-blog',
    name: 'Akamai Blog',
    url: 'https://feeds.feedburner.com/akamai/blog',
    type: 'news' as const,
    enabled: true,
  },
];

router.get('/', (_req, res) => {
  try {
    const dataDir = path.resolve(__dirname, '..', 'data');

    /* Enrich each source with item count and last-fetched from data files */
    const enriched = SOURCES.map((source) => {
      const dataFile = source.type === 'threat' ? 'threats.json' : 'news.json';
      const filePath = path.join(dataDir, dataFile);
      let itemCount = 0;
      let lastFetched: string | undefined;
      let status: 'active' | 'error' | 'pending' = 'pending';

      try {
        const stat = statSync(filePath);
        lastFetched = stat.mtime.toISOString();
        const data = JSON.parse(readFileSync(filePath, 'utf-8'));
        itemCount = Array.isArray(data) ? data.length : 0;
        status = 'active';
      } catch {
        status = 'error';
      }

      return { ...source, itemCount, lastFetched, status };
    });

    res.json(enriched);
  } catch {
    res.status(500).json({ error: 'Failed to read sources' });
  }
});

export default router;
