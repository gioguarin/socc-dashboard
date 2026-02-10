import { describe, it, expect } from 'vitest';
import {
  highlightMatch,
  searchThreats,
  searchNews,
  searchStocks,
  searchBriefings,
  searchAll,
} from './search';
import type { ThreatItem, NewsItem, StockData, Briefing } from '../types';

describe('search utilities', () => {
  describe('highlightMatch', () => {
    it('highlights matching text with mark tags', () => {
      const result = highlightMatch('This is a test', 'test');
      expect(result).toContain('<mark');
      expect(result).toContain('test');
      expect(result).toContain('</mark>');
    });

    it('handles case-insensitive matching', () => {
      const result = highlightMatch('TEST this Test', 'test');
      // Matches 'TEST' and 'Test' (not 'this')
      expect(result.match(/<mark/g)?.length).toBe(2);
    });

    it('returns original text for empty query', () => {
      const text = 'No highlighting';
      expect(highlightMatch(text, '')).toBe(text);
      expect(highlightMatch(text, '   ')).toBe(text);
    });

    it('escapes regex special characters', () => {
      const result = highlightMatch('Price is $100', '$100');
      expect(result).toContain('<mark');
      expect(result).toContain('$100');
    });

    it('handles multiple matches', () => {
      const result = highlightMatch('test test test', 'test');
      expect(result.match(/<mark/g)?.length).toBe(3);
    });

    it('applies correct CSS classes', () => {
      const result = highlightMatch('highlight this', 'this');
      expect(result).toContain('bg-socc-cyan/30');
      expect(result).toContain('text-socc-cyan');
    });
  });

  describe('searchThreats', () => {
    const mockThreats: ThreatItem[] = [
      {
        id: '1',
        title: 'SQL Injection Vulnerability',
        description: 'Critical vulnerability in database',
        cveId: 'CVE-2024-1234',
        severity: 'critical',
        source: 'CISA KEV',
        url: 'https://example.com/1',
        publishedAt: '2024-01-01',
        affectedProducts: ['MySQL', 'PostgreSQL'],
      },
      {
        id: '2',
        title: 'XSS Attack Vector',
        description: 'Cross-site scripting issue',
        cveId: 'CVE-2024-5678',
        severity: 'high',
        source: 'NVD',
        url: 'https://example.com/2',
        publishedAt: '2024-01-02',
        affectedProducts: ['WordPress'],
      },
    ];

    it('searches by title', () => {
      const results = searchThreats(mockThreats, 'SQL');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('SQL');
    });

    it('searches by CVE ID', () => {
      const results = searchThreats(mockThreats, 'CVE-2024-5678');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('CVE-2024-5678');
    });

    it('searches by description', () => {
      const results = searchThreats(mockThreats, 'database');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('searches by affected products', () => {
      const results = searchThreats(mockThreats, 'WordPress');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('is case-insensitive', () => {
      const results = searchThreats(mockThreats, 'mysql');
      expect(results).toHaveLength(1);
    });

    it('returns empty array for no matches', () => {
      const results = searchThreats(mockThreats, 'nonexistent');
      expect(results).toEqual([]);
    });

    it('returns search results with correct structure', () => {
      const results = searchThreats(mockThreats, 'SQL');
      expect(results[0]).toMatchObject({
        id: '1',
        type: 'threat',
        view: 'threats',
        url: 'https://example.com/1',
      });
      expect(results[0].title).toBeDefined();
      expect(results[0].subtitle).toBeDefined();
      expect(results[0].matchField).toBeDefined();
    });

    it('formats subtitle with severity and source', () => {
      const results = searchThreats(mockThreats, 'SQL');
      expect(results[0].subtitle).toContain('CRITICAL');
      expect(results[0].subtitle).toContain('CISA KEV');
    });

    it('includes CVE ID in title when present', () => {
      const results = searchThreats(mockThreats, 'SQL');
      expect(results[0].title).toContain('CVE-2024-1234');
    });
  });

  describe('searchNews', () => {
    const mockNews: NewsItem[] = [
      {
        id: '1',
        title: 'Cloudflare launches new security feature',
        summary: 'Enhanced DDoS protection',
        source: 'Cloudflare Blog',
        category: 'CDN',
        url: 'https://example.com/news1',
        publishedAt: '2024-01-01',
        sentiment: 'positive',
      },
      {
        id: '2',
        title: 'Akamai reports Q4 earnings',
        summary: 'Revenue growth exceeds expectations',
        source: 'Reuters',
        category: 'CDN',
        url: 'https://example.com/news2',
        publishedAt: '2024-01-02',
        sentiment: 'positive',
      },
    ];

    it('searches by title', () => {
      const results = searchNews(mockNews, 'Cloudflare');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('searches by summary', () => {
      const results = searchNews(mockNews, 'DDoS');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('is case-insensitive', () => {
      const results = searchNews(mockNews, 'cloudflare');
      expect(results).toHaveLength(1);
    });

    it('returns search results with correct structure', () => {
      const results = searchNews(mockNews, 'Cloudflare');
      expect(results[0]).toMatchObject({
        id: '1',
        type: 'news',
        view: 'news',
        url: 'https://example.com/news1',
      });
    });

    it('formats subtitle with source and category', () => {
      const results = searchNews(mockNews, 'Cloudflare');
      expect(results[0].subtitle).toContain('Cloudflare Blog');
      expect(results[0].subtitle).toContain('CDN');
    });
  });

  describe('searchStocks', () => {
    const mockStocks: StockData[] = [
      {
        symbol: 'AKAM',
        name: 'Akamai Technologies',
        price: 120.50,
        change: 2.30,
        changePercent: 1.95,
        volume: 1000000,
        marketCap: 19000000000,
        high: 122.00,
        low: 118.00,
        open: 119.00,
        previousClose: 118.20,
        history: [],
      },
      {
        symbol: 'NET',
        name: 'Cloudflare Inc',
        price: 85.20,
        change: -1.50,
        changePercent: -1.73,
        volume: 500000,
        marketCap: 28000000000,
        high: 87.00,
        low: 84.50,
        open: 86.70,
        previousClose: 86.70,
        history: [],
      },
    ];

    it('searches by symbol', () => {
      const results = searchStocks(mockStocks, 'AKAM');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('AKAM');
    });

    it('searches by company name', () => {
      const results = searchStocks(mockStocks, 'Cloudflare');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('NET');
    });

    it('is case-insensitive', () => {
      const results = searchStocks(mockStocks, 'akamai');
      expect(results).toHaveLength(1);
    });

    it('returns search results with correct structure', () => {
      const results = searchStocks(mockStocks, 'AKAM');
      expect(results[0]).toMatchObject({
        id: 'AKAM',
        type: 'stock',
        view: 'stocks',
      });
    });

    it('formats subtitle with price and change', () => {
      const results = searchStocks(mockStocks, 'AKAM');
      expect(results[0].subtitle).toContain('$120.50');
      expect(results[0].subtitle).toContain('+1.95%');
    });

    it('handles negative price changes', () => {
      const results = searchStocks(mockStocks, 'NET');
      expect(results[0].subtitle).toContain('-1.73%');
    });
  });

  describe('searchBriefings', () => {
    const mockBriefings: Briefing[] = [
      {
        id: '1',
        date: '2024-01-01',
        content: 'Daily briefing about security incidents',
        highlights: ['CVE-2024-1234 critical', '3 new threats'],
        threatCount: 3,
        newsCount: 5,
      },
      {
        id: '2',
        date: '2024-01-02',
        content: 'Stock market updates and tech news',
        highlights: ['Market up 2%', 'Cloudflare earnings'],
        threatCount: 1,
        newsCount: 8,
      },
    ];

    it('searches by content', () => {
      const results = searchBriefings(mockBriefings, 'security');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('searches by highlights', () => {
      const results = searchBriefings(mockBriefings, 'CVE-2024-1234');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('is case-insensitive', () => {
      const results = searchBriefings(mockBriefings, 'CLOUDFLARE');
      expect(results).toHaveLength(1);
    });

    it('returns search results with correct structure', () => {
      const results = searchBriefings(mockBriefings, 'security');
      expect(results[0]).toMatchObject({
        id: '1',
        type: 'briefing',
        view: 'briefings',
      });
    });

    it('formats title with date', () => {
      const results = searchBriefings(mockBriefings, 'security');
      expect(results[0].title).toContain('2024-01-01');
    });

    it('includes highlights in subtitle', () => {
      const results = searchBriefings(mockBriefings, 'security');
      expect(results[0].subtitle).toBeDefined();
    });
  });

  describe('searchAll', () => {
    const mockData = {
      threats: [
        {
          id: '1',
          title: 'SQL Injection',
          description: 'Critical SQL vulnerability',
          cveId: 'CVE-2024-1234',
          severity: 'critical' as const,
          source: 'CISA',
          url: 'https://example.com/1',
          publishedAt: '2024-01-01',
        },
      ],
      news: [
        {
          id: '1',
          title: 'Security update released',
          summary: 'New SQL protection features',
          source: 'Blog',
          category: 'Security',
          url: 'https://example.com/news1',
          publishedAt: '2024-01-01',
          sentiment: 'positive' as const,
        },
      ],
      stocks: [
        {
          symbol: 'TEST',
          name: 'Test Company',
          price: 100,
          change: 1,
          changePercent: 1,
          volume: 1000,
          marketCap: 1000000,
          high: 101,
          low: 99,
          open: 100,
          previousClose: 99,
          history: [],
        },
      ],
      briefings: [
        {
          id: '1',
          date: '2024-01-01',
          content: 'SQL vulnerability briefing',
          highlights: ['Critical CVE'],
          threatCount: 1,
          newsCount: 1,
        },
      ],
    };

    it('searches across all data types', () => {
      const results = searchAll('SQL', mockData);
      expect(results.length).toBeGreaterThan(1);

      const types = results.map(r => r.type);
      expect(types).toContain('threat');
      expect(types).toContain('news');
      expect(types).toContain('briefing');
    });

    it('returns empty array for empty query', () => {
      const results = searchAll('', mockData);
      expect(results).toEqual([]);
    });

    it('returns empty array for whitespace query', () => {
      const results = searchAll('   ', mockData);
      expect(results).toEqual([]);
    });

    it('handles missing data gracefully', () => {
      const results = searchAll('SQL', {});
      expect(results).toEqual([]);
    });

    it('caps results at 50', () => {
      // Create 60 matching items
      const manyThreats = Array.from({ length: 60 }, (_, i) => ({
        id: String(i),
        title: `SQL Vulnerability ${i}`,
        description: 'Test',
        cveId: `CVE-2024-${i}`,
        severity: 'critical' as const,
        source: 'Test',
        url: `https://example.com/${i}`,
        publishedAt: '2024-01-01',
      }));

      const results = searchAll('SQL', { threats: manyThreats });
      expect(results.length).toBe(50);
    });

    it('searches specific data types when provided', () => {
      const results = searchAll('SQL', { threats: mockData.threats });
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('threat');
    });
  });
});
