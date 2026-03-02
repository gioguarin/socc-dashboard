import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportBriefingMarkdown, exportBriefingPdf, exportThreatsCsv } from './exporters';
import type { Briefing, ThreatItem } from '../types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const sampleBriefing: Briefing = {
  id: 'b-1',
  date: '2024-06-15',
  content: '## Summary\n\nThings happened today.',
  highlights: ['CVE-2024-1234 patched', 'New partnership announced'],
  createdAt: '2024-06-15T06:30:00Z',
};

const briefingNoHighlights: Briefing = {
  id: 'b-2',
  date: '2024-06-16',
  content: 'Quiet day.',
  highlights: [],
  createdAt: '2024-06-16T06:30:00Z',
};

const sampleThreats: ThreatItem[] = [
  {
    id: 't1',
    cveId: 'CVE-2024-1234',
    title: 'SQL Injection in FooDB',
    severity: 'critical',
    cvssScore: 9.8,
    source: 'CISA KEV',
    publishedAt: '2024-06-15',
    status: 'new',
    cisaKev: true,
    url: 'https://example.com/cve1',
    description: 'Critical SQL injection',
    affectedProducts: ['FooDB'],
  },
  {
    id: 't2',
    cveId: undefined,
    title: 'XSS with "quotes" in title',
    severity: 'high',
    cvssScore: undefined,
    source: 'NVD',
    publishedAt: '2024-06-14',
    status: 'reviewed',
    cisaKev: false,
    url: '',
    description: 'XSS issue',
    affectedProducts: [],
  },
];

// ─── exportBriefingMarkdown ───────────────────────────────────────────────────

describe('exportBriefingMarkdown', () => {
  let createdObjectUrl: string | null = null;
  let appendedChild: HTMLElement | null = null;

  beforeEach(() => {
    createdObjectUrl = null;
    appendedChild = null;

    // Stub URL.createObjectURL / revokeObjectURL
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => {
        createdObjectUrl = 'blob:mock-url';
        return createdObjectUrl;
      }),
      revokeObjectURL: vi.fn(),
    });

    // Spy on document.createElement to capture the anchor
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === 'a') {
        vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => {});
      }
      return el;
    });

    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      appendedChild = node as HTMLElement;
      return node;
    });
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('creates a Blob and triggers a download', () => {
    exportBriefingMarkdown(sampleBriefing);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(document.body.appendChild).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('filename includes the briefing date', () => {
    let capturedFilename = '';
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const realCreate2 = HTMLAnchorElement;
      const el = document.createElementNS('http://www.w3.org/1999/xhtml', tag) as HTMLAnchorElement;
      if (tag === 'a') {
        Object.defineProperty(el, 'download', {
          set(v) { capturedFilename = v; },
          get() { return capturedFilename; },
        });
        vi.spyOn(el, 'click').mockImplementation(() => {});
      }
      return el;
    });

    exportBriefingMarkdown(sampleBriefing);
    expect(capturedFilename).toContain('2024-06-15');
    expect(capturedFilename).toMatch(/\.md$/);
  });

  it('markdown content includes the date header', () => {
    let blobContent = '';
    vi.stubGlobal('Blob', class MockBlob {
      constructor(parts: string[]) { blobContent = parts.join(''); }
    });

    exportBriefingMarkdown(sampleBriefing);
    expect(blobContent).toContain('# SOCC Briefing');
    expect(blobContent).toContain('2024-06-15');
  });

  it('includes highlights section when highlights are present', () => {
    let blobContent = '';
    vi.stubGlobal('Blob', class MockBlob {
      constructor(parts: string[]) { blobContent = parts.join(''); }
    });

    exportBriefingMarkdown(sampleBriefing);
    expect(blobContent).toContain('## Key Highlights');
    expect(blobContent).toContain('- CVE-2024-1234 patched');
    expect(blobContent).toContain('- New partnership announced');
  });

  it('omits highlights section when highlights array is empty', () => {
    let blobContent = '';
    vi.stubGlobal('Blob', class MockBlob {
      constructor(parts: string[]) { blobContent = parts.join(''); }
    });

    exportBriefingMarkdown(briefingNoHighlights);
    expect(blobContent).not.toContain('## Key Highlights');
  });

  it('includes the briefing content', () => {
    let blobContent = '';
    vi.stubGlobal('Blob', class MockBlob {
      constructor(parts: string[]) { blobContent = parts.join(''); }
    });

    exportBriefingMarkdown(sampleBriefing);
    expect(blobContent).toContain(sampleBriefing.content);
  });
});

// ─── exportBriefingPdf ────────────────────────────────────────────────────────

describe('exportBriefingPdf', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns early without throwing when window.open returns null', () => {
    vi.stubGlobal('open', vi.fn(() => null));
    expect(() => exportBriefingPdf(sampleBriefing)).not.toThrow();
    vi.unstubAllGlobals();
  });

  it('calls window.open and writes HTML to the new window', () => {
    const mockPrint = vi.fn();
    const mockWrite = vi.fn();
    const mockClose = vi.fn();
    const mockDoc = { write: mockWrite, close: mockClose };
    const mockWindow = { document: mockDoc, print: mockPrint };

    vi.stubGlobal('open', vi.fn(() => mockWindow));
    vi.useFakeTimers();

    exportBriefingPdf(sampleBriefing);

    expect(mockWrite).toHaveBeenCalledOnce();
    expect(mockClose).toHaveBeenCalledOnce();

    // print is called after a 300ms delay
    vi.advanceTimersByTime(300);
    expect(mockPrint).toHaveBeenCalledOnce();

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('includes the briefing date in the written HTML', () => {
    let writtenHtml = '';
    const mockWindow = {
      document: { write: (html: string) => { writtenHtml = html; }, close: vi.fn() },
      print: vi.fn(),
    };

    vi.stubGlobal('open', vi.fn(() => mockWindow));
    vi.useFakeTimers();

    exportBriefingPdf(sampleBriefing);

    expect(writtenHtml).toContain('2024-06-15');
    expect(writtenHtml).toContain('SOCC');

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('includes highlights in HTML when present', () => {
    let writtenHtml = '';
    const mockWindow = {
      document: { write: (html: string) => { writtenHtml = html; }, close: vi.fn() },
      print: vi.fn(),
    };

    vi.stubGlobal('open', vi.fn(() => mockWindow));
    vi.useFakeTimers();

    exportBriefingPdf(sampleBriefing);

    expect(writtenHtml).toContain('Key Highlights');
    expect(writtenHtml).toContain('CVE-2024-1234 patched');

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('omits highlights block when highlights is empty', () => {
    let writtenHtml = '';
    const mockWindow = {
      document: { write: (html: string) => { writtenHtml = html; }, close: vi.fn() },
      print: vi.fn(),
    };

    vi.stubGlobal('open', vi.fn(() => mockWindow));
    vi.useFakeTimers();

    exportBriefingPdf(briefingNoHighlights);

    expect(writtenHtml).not.toContain('Key Highlights');

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});

// ─── exportThreatsCsv ─────────────────────────────────────────────────────────

describe('exportThreatsCsv', () => {
  let blobContents: string[] = [];

  beforeEach(() => {
    blobContents = [];

    vi.stubGlobal('Blob', class MockBlob {
      type: string;
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        blobContents = parts as string[];
        this.type = opts?.type ?? '';
      }
    });

    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:csv-url'),
      revokeObjectURL: vi.fn(),
    });

    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === 'a') {
        vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(() => {});
      }
      return el;
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('triggers a file download', () => {
    exportThreatsCsv(sampleThreats);
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(document.body.appendChild).toHaveBeenCalledOnce();
  });

  it('includes CSV headers as first row', () => {
    exportThreatsCsv(sampleThreats);
    const csv = blobContents.join('');
    const firstLine = csv.split('\n')[0];
    expect(firstLine).toContain('CVE ID');
    expect(firstLine).toContain('Title');
    expect(firstLine).toContain('Severity');
    expect(firstLine).toContain('CVSS Score');
    expect(firstLine).toContain('CISA KEV');
  });

  it('includes one row per threat', () => {
    exportThreatsCsv(sampleThreats);
    const csv = blobContents.join('');
    const rows = csv.split('\n');
    // header + 2 data rows
    expect(rows).toHaveLength(3);
  });

  it('formats cisaKev as Yes/No', () => {
    exportThreatsCsv(sampleThreats);
    const csv = blobContents.join('');
    expect(csv).toContain('Yes');  // first threat: cisaKev: true
    expect(csv).toContain('No');   // second threat: cisaKev: false
  });

  it('handles missing cveId (outputs empty string)', () => {
    exportThreatsCsv(sampleThreats);
    const csv = blobContents.join('');
    const lines = csv.split('\n');
    // second row: cveId is undefined → should have empty first column
    expect(lines[2]).toMatch(/^,/);
  });

  it('handles missing cvssScore (outputs empty string)', () => {
    exportThreatsCsv(sampleThreats);
    const csv = blobContents.join('');
    // second row has no cvssScore
    expect(csv).toContain(',,');
  });

  it('escapes double quotes in title', () => {
    exportThreatsCsv(sampleThreats);
    const csv = blobContents.join('');
    // title with quotes: 'XSS with "quotes" in title' should be quoted as ""quotes""
    expect(csv).toContain('""quotes""');
  });

  it('handles an empty threats array — only header row', () => {
    exportThreatsCsv([]);
    const csv = blobContents.join('');
    const rows = csv.split('\n');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain('CVE ID');
  });

  it('uses text/csv mime type', () => {
    // Capture the Blob constructor call to check type
    let capturedType = '';
    vi.stubGlobal('Blob', class MockBlob2 {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        blobContents = parts as string[];
        capturedType = opts?.type ?? '';
      }
    });

    exportThreatsCsv(sampleThreats);
    expect(capturedType).toContain('text/csv');
  });
});
