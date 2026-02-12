/**
 * Rich briefing generator.
 * Builds a daily security briefing from current threat, news, and stock data
 * with optional weather. Output is formatted markdown for display in BriefingCard.
 */

import { readDataFile } from '../utils.js';
import type { StoredBriefing } from './store.js';

interface ThreatItem {
  title: string;
  severity: string;
  cvssScore: number | null;
  source: string;
  publishedAt: string;
  cisaKev: boolean;
  cveId: string | null;
  affectedProducts?: string[];
}

interface NewsItem {
  title: string;
  source: string;
  publishedAt: string;
  category?: string;
}

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0, high: 1, medium: 2, low: 3, info: 4,
};

const COMPETITOR_SOURCES = ['zscaler', 'crowdstrike', 'paloalto', 'fastly', 'f5'];

const COMPETITOR_LABELS: Record<string, string> = {
  zscaler: 'Zscaler', crowdstrike: 'CrowdStrike', paloalto: 'Palo Alto',
  fastly: 'Fastly', f5: 'F5',
};

/** Fetch weather from wttr.in with 5s timeout */
async function fetchWeather(location: string): Promise<string> {
  try {
    const res = await fetch(
      `https://wttr.in/${encodeURIComponent(location)}?format=j1`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return `*Weather data unavailable (HTTP ${res.status})*`;
    const data = await res.json();
    const cur = data.current_condition?.[0];
    if (!cur) return '*Weather data unavailable*';
    const tempF = cur.temp_F;
    const feelsF = cur.FeelsLikeF;
    const condition = cur.weatherDesc?.[0]?.value ?? 'Unknown';
    const humidity = cur.humidity;
    return `Currently ${tempF}°F (feels like ${feelsF}°F), ${condition}. Humidity: ${humidity}%.`;
  } catch {
    return '*Weather data unavailable — check your phone.*';
  }
}

/** Sort items by publishedAt descending */
function byDateDesc<T extends { publishedAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/** Prioritize security/incident items, then sort by date */
function prioritizeSecurityNews(items: NewsItem[]): NewsItem[] {
  const security = items.filter((n) => n.category === 'security' || n.category === 'incident');
  const other = items.filter((n) => n.category !== 'security' && n.category !== 'incident');
  return [...byDateDesc(security), ...byDateDesc(other)];
}

function buildNewsSection(news: NewsItem[]): string[] {
  const lines: string[] = [];

  // Akamai news
  const akamai = prioritizeSecurityNews(news.filter((n) => n.source === 'akamai'));
  if (akamai.length > 0) {
    lines.push('### 📰 Akamai News');
    for (const item of akamai.slice(0, 5)) {
      const flag = (item.category === 'security' || item.category === 'incident') ? '⚠️ ' : '';
      lines.push(`- ${flag}${item.title}`);
    }
    if (akamai.length > 5) lines.push(`- *...and ${akamai.length - 5} more*`);
    lines.push('');
  }

  // Cloudflare news
  const cloudflare = prioritizeSecurityNews(news.filter((n) => n.source === 'cloudflare'));
  if (cloudflare.length > 0) {
    lines.push('### ☁️ Cloudflare Watch');
    for (const item of cloudflare.slice(0, 3)) {
      const flag = (item.category === 'security' || item.category === 'incident') ? '⚠️ ' : '';
      lines.push(`- ${flag}${item.title}`);
    }
    lines.push('');
  }

  // Competitor intel
  const competitorLines: string[] = [];
  for (const src of COMPETITOR_SOURCES) {
    const items = byDateDesc(news.filter((n) => n.source === src));
    if (items.length === 0) continue;
    const sec = items.filter((n) => n.category === 'security' || n.category === 'incident');
    const pick = sec[0] ?? items[0];
    const label = COMPETITOR_LABELS[src] ?? src;
    competitorLines.push(`- **${label}**: ${pick.title} *(${items.length} articles)*`);
  }
  if (competitorLines.length > 0) {
    lines.push('### 🏢 Competitor Intel');
    lines.push(...competitorLines);
    lines.push('');
  }

  return lines;
}

function buildThreatsSection(threats: ThreatItem[]): string[] {
  const lines: string[] = [];
  const critical = byDateDesc(threats.filter((t) => t.severity === 'critical'));
  const high = byDateDesc(threats.filter((t) => t.severity === 'high'));
  const kevCount = threats.filter((t) => t.cisaKev).length;

  lines.push('### 🛡️ Threat Intel');
  lines.push(`*${threats.length} tracked — ${critical.length} critical, ${high.length} high*`);
  lines.push('');

  if (critical.length > 0) {
    lines.push('**🔴 Critical**');
    for (const t of critical.slice(0, 8)) {
      const parts = [t.title];
      if (t.cvssScore) parts.push(`CVSS ${t.cvssScore}`);
      if (t.cveId) parts.push(t.cveId);
      const kev = t.cisaKev ? ' — 🚨 **CISA KEV — actively exploited**' : '';
      lines.push(`- ${parts.join(' — ')}${kev}`);
    }
    if (critical.length > 8) lines.push(`- *...and ${critical.length - 8} more critical*`);
    lines.push('');
  }

  if (high.length > 0) {
    lines.push('**🟠 High**');
    for (const t of high.slice(0, 5)) {
      const parts = [t.title];
      if (t.cvssScore) parts.push(`CVSS ${t.cvssScore}`);
      if (t.cveId) parts.push(t.cveId);
      const kev = t.cisaKev ? ' — 🚨 **CISA KEV**' : '';
      lines.push(`- ${parts.join(' — ')}${kev}`);
    }
    lines.push('');
  }

  if (kevCount > 0) {
    lines.push(`**${kevCount}** item${kevCount !== 1 ? 's' : ''} in the CISA Known Exploited Vulnerabilities catalog.`);
    lines.push('');
  }

  return lines;
}

function buildStocksSection(stocks: StockItem[]): string[] {
  const lines: string[] = [];
  lines.push('### 📈 Market Watch');

  // Primary: AKAM and NET
  const primary = stocks.filter((s) => s.symbol === 'AKAM' || s.symbol === 'NET');
  for (const s of primary) {
    const dir = s.change >= 0 ? '📈' : '📉';
    const sign = s.change >= 0 ? '+' : '';
    const trend = s.changePercent >= 3 ? 'Strong rally'
      : s.changePercent >= 0.5 ? 'Trending up'
      : s.changePercent <= -3 ? 'Sharp pullback'
      : s.changePercent <= -0.5 ? 'Trending down'
      : 'Flat';
    lines.push(`- **${s.symbol}** $${s.price.toFixed(2)} (${sign}${s.changePercent.toFixed(2)}%) ${dir} ${trend}`);
  }

  // Secondary: other tracked stocks on one line
  const secondary = stocks.filter((s) => s.symbol !== 'AKAM' && s.symbol !== 'NET');
  if (secondary.length > 0) {
    const summaries = secondary.map((s) => {
      const sign = s.change >= 0 ? '+' : '';
      return `${s.symbol} $${s.price.toFixed(2)} (${sign}${s.changePercent.toFixed(2)}%)`;
    });
    lines.push(`- ${summaries.join(' | ')}`);
  }

  lines.push('');
  return lines;
}

/** Build the full briefing from current data */
export async function buildBriefing(): Promise<StoredBriefing> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const threats = readDataFile<ThreatItem[]>('threats.json', []);
  const news = readDataFile<NewsItem[]>('news.json', []);
  const stocks = readDataFile<StockItem[]>('stocks.json', []);

  const weatherLocation = process.env.SOCC_WEATHER_LOCATION ?? 'Greenacres+FL';

  // Build all sections
  const lines: string[] = [];
  lines.push(`## ☀️ SOCC Morning Briefing — ${dateStr}`);
  lines.push('');

  // Weather
  const weather = await fetchWeather(weatherLocation);
  lines.push(`### 🌤️ Weather — ${weatherLocation.replace(/\+/g, ' ')}`);
  lines.push(weather);
  lines.push('');

  // News
  lines.push(...buildNewsSection(news));

  // Threats
  lines.push(...buildThreatsSection(threats));

  // Stocks
  if (stocks.length > 0) {
    lines.push(...buildStocksSection(stocks));
  }

  // Sign-off
  lines.push('---');
  lines.push('');
  lines.push('Stay sharp out there. ☕');

  // Build highlights
  const critical = threats.filter((t) => t.severity === 'critical').length;
  const kevCount = threats.filter((t) => t.cisaKev).length;
  const akam = stocks.find((s) => s.symbol === 'AKAM');
  const net = stocks.find((s) => s.symbol === 'NET');

  const highlights: string[] = [];
  if (critical > 0) highlights.push(`${critical} critical threats`);
  if (kevCount > 0) highlights.push(`${kevCount} CISA KEV`);
  if (akam) highlights.push(`AKAM $${akam.price.toFixed(2)} (${akam.change >= 0 ? '+' : ''}${akam.changePercent.toFixed(1)}%)`);
  if (net) highlights.push(`NET $${net.price.toFixed(2)} (${net.change >= 0 ? '+' : ''}${net.changePercent.toFixed(1)}%)`);
  highlights.push(`${news.length} news articles`);

  return {
    id: `briefing-${now.getTime()}`,
    date: today,
    content: lines.join('\n'),
    highlights,
    createdAt: now.toISOString(),
  };
}
