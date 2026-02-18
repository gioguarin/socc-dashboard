export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: 'akamai' | 'cloudflare' | 'fastly' | 'zscaler' | 'crowdstrike' | 'paloalto' | 'f5' | 'general';
  url: string;
  publishedAt: string;
  category: 'product' | 'security' | 'business' | 'research' | 'incident';
  status: 'new' | 'reviewed' | 'flagged' | 'dismissed';
  sentiment?: 'positive' | 'negative' | 'neutral';
  tldr?: string;
}

export interface ThreatItem {
  id: string;
  cveId?: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvssScore?: number;
  source: string;
  publishedAt: string;
  affectedProducts?: string[];
  patchUrls?: string[];
  affectedVendors?: string[];
  status: 'new' | 'investigating' | 'mitigated' | 'not_applicable';
  cisaKev: boolean;
  url?: string;
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
  lastUpdated: string;
}

export interface StockEarnings {
  lastEarningsDate: string | null;
  nextEarningsDate: string | null;
  lastEarningsEps: number | null;
  lastEarningsRevenue: number | null;
}

export interface StockDetailData {
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
  earnings: StockEarnings;
  lastUpdated: string;
}

export type StockRange = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max';

export interface Briefing {
  id: string;
  date: string;
  content: string;
  highlights: string[];
  createdAt: string;
}

export interface RssSource {
  id: string;
  name: string;
  url: string;
  type: 'threat' | 'news';
  enabled: boolean;
  lastFetched?: string;
  itemCount?: number;
  status: 'active' | 'error' | 'pending';
}

export interface SearchResult {
  id: string;
  type: 'threat' | 'news' | 'stock' | 'briefing';
  title: string;
  subtitle: string;
  url?: string;
  matchField: string;
  view: View;
}

export type View = 'dashboard' | 'threats' | 'news' | 'stocks' | 'briefings' | 'notes' | 'projects' | 'calendar';

export type CalendarTimeRange = '12h' | '24h' | '72h' | '1w' | '30d';

export interface CalendarSource {
  id: string;
  name: string;
  url: string | null;
  color: string;
  enabled: boolean;
  lastSynced: string | null;
  type: 'ics-url' | 'ics-file' | 'manual';
}

export interface ParsedCalendarEvent {
  id: string;
  uid: string;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
  sourceId: string;
  color: string;
}

/* ── Phase 3: Personal Ops ── */

export interface ShiftNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'active' | 'paused' | 'completed';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  description: string;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'deadline' | 'event';
  projectId: string | null;
}

export interface QuickLink {
  id: string;
  name: string;
  url: string;
  icon: string;
}
