/**
 * Global search utilities for filtering across all data panels.
 * Client-side only — no server calls needed.
 */

import type { ThreatItem, NewsItem, StockData, Briefing, SearchResult } from '../types';

/** Escape regex special chars in user input */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Check if text matches search query (case-insensitive) */
function matches(text: string | undefined | null, query: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}

/** Highlight matching text with <mark> tags */
export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = escapeRegex(query);
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark class="bg-socc-cyan/30 text-socc-cyan rounded px-0.5">$1</mark>');
}

/** Search threats and return matching results */
export function searchThreats(threats: ThreatItem[], query: string): SearchResult[] {
  return threats
    .filter((t) =>
      matches(t.title, query) ||
      matches(t.description, query) ||
      matches(t.cveId, query) ||
      t.affectedProducts?.some((p) => matches(p, query))
    )
    .map((t) => ({
      id: t.id,
      type: 'threat' as const,
      title: t.cveId ? `${t.cveId}: ${t.title}` : t.title,
      subtitle: `${t.severity.toUpperCase()} · ${t.source}`,
      url: t.url,
      matchField: findMatchField(query, [
        { field: 'CVE', value: t.cveId },
        { field: 'Title', value: t.title },
        { field: 'Description', value: t.description },
        { field: 'Product', value: t.affectedProducts?.join(', ') },
      ]),
      view: 'threats' as const,
    }));
}

/** Search news items */
export function searchNews(news: NewsItem[], query: string): SearchResult[] {
  return news
    .filter((n) =>
      matches(n.title, query) ||
      matches(n.summary, query)
    )
    .map((n) => ({
      id: n.id,
      type: 'news' as const,
      title: n.title,
      subtitle: `${n.source} · ${n.category}`,
      url: n.url,
      matchField: findMatchField(query, [
        { field: 'Title', value: n.title },
        { field: 'Summary', value: n.summary },
      ]),
      view: 'news' as const,
    }));
}

/** Search stocks */
export function searchStocks(stocks: StockData[], query: string): SearchResult[] {
  return stocks
    .filter((s) =>
      matches(s.symbol, query) ||
      matches(s.name, query)
    )
    .map((s) => ({
      id: s.symbol,
      type: 'stock' as const,
      title: `${s.symbol} — ${s.name}`,
      subtitle: `$${s.price.toFixed(2)} (${s.change >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%)`,
      matchField: findMatchField(query, [
        { field: 'Symbol', value: s.symbol },
        { field: 'Name', value: s.name },
      ]),
      view: 'stocks' as const,
    }));
}

/** Search briefings */
export function searchBriefings(briefings: Briefing[], query: string): SearchResult[] {
  return briefings
    .filter((b) =>
      matches(b.content, query) ||
      b.highlights.some((h) => matches(h, query))
    )
    .map((b) => ({
      id: b.id,
      type: 'briefing' as const,
      title: `Briefing — ${b.date}`,
      subtitle: b.highlights.slice(0, 2).join(', ') || 'No highlights',
      matchField: findMatchField(query, [
        { field: 'Content', value: b.content },
        { field: 'Highlight', value: b.highlights.join(', ') },
      ]),
      view: 'briefings' as const,
    }));
}

/** Find which field matched the query for display */
function findMatchField(
  query: string,
  fields: { field: string; value: string | undefined }[]
): string {
  for (const { field, value } of fields) {
    if (matches(value, query)) return field;
  }
  return 'Unknown';
}

/** Search across all data types */
export function searchAll(
  query: string,
  data: {
    threats?: ThreatItem[];
    news?: NewsItem[];
    stocks?: StockData[];
    briefings?: Briefing[];
  }
): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [
    ...searchThreats(data.threats || [], query),
    ...searchNews(data.news || [], query),
    ...searchStocks(data.stocks || [], query),
    ...searchBriefings(data.briefings || [], query),
  ];

  /* Cap total results for performance */
  return results.slice(0, 50);
}
