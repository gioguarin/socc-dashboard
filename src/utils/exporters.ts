/**
 * Export utilities for briefings (Markdown/PDF) and threats (CSV).
 * Uses browser-native APIs — no heavy libraries.
 */

import type { ThreatItem, Briefing } from '../types';

/** Escape HTML entities to prevent XSS in document.write */
function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Trigger a file download in the browser */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Export a briefing as a Markdown file */
export function exportBriefingMarkdown(briefing: Briefing): void {
  const lines: string[] = [
    `# SOCC Briefing — ${briefing.date}`,
    '',
    `> Generated: ${new Date(briefing.createdAt).toLocaleString()}`,
    '',
  ];

  if (briefing.highlights.length > 0) {
    lines.push('## Key Highlights', '');
    briefing.highlights.forEach((h) => lines.push(`- ${h}`));
    lines.push('');
  }

  lines.push('## Briefing Content', '', briefing.content);

  const md = lines.join('\n');
  const filename = `socc-briefing-${briefing.date}.md`;
  downloadFile(md, filename, 'text/markdown;charset=utf-8');
}

/** Export a briefing as PDF using window.print() with a print-specific layout */
export function exportBriefingPdf(briefing: Briefing): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const highlightsHtml = briefing.highlights.length > 0
    ? `<div class="highlights">
        <h2>Key Highlights</h2>
        <ul>${briefing.highlights.map((h) => `<li>${escHtml(h)}</li>`).join('')}</ul>
       </div>`
    : '';

  // Convert basic markdown to HTML for printing (escape first, then apply formatting)
  const contentHtml = escHtml(briefing.content)
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^\*\*(.+?)\*\*/gm, '<strong>$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SOCC Briefing — ${escHtml(briefing.date)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
        .header { border-bottom: 2px solid #0891b2; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { font-size: 24px; color: #0891b2; }
        .header .meta { font-size: 12px; color: #666; margin-top: 4px; }
        .highlights { background: #f0f9ff; border-left: 3px solid #0891b2; padding: 12px 16px; margin-bottom: 24px; border-radius: 4px; }
        .highlights h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #0891b2; margin-bottom: 8px; }
        .highlights ul { padding-left: 20px; }
        .highlights li { font-size: 13px; margin-bottom: 4px; }
        .content { font-size: 14px; }
        .content h2 { font-size: 18px; margin: 20px 0 8px; color: #333; }
        .content h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 6px; color: #0891b2; }
        .content li { margin-left: 20px; margin-bottom: 4px; }
        .content strong { color: #111; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 10px; color: #999; text-align: center; }
        @media print {
          body { padding: 20px; }
          .footer { position: fixed; bottom: 20px; left: 0; right: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🛡️ SOCC Daily Briefing</h1>
        <div class="meta">Date: ${escHtml(briefing.date)} | Generated: ${escHtml(new Date(briefing.createdAt).toLocaleString())}</div>
      </div>
      ${highlightsHtml}
      <div class="content">${contentHtml}</div>
      <div class="footer">SOCC Dashboard — Security Operations Command Center</div>
    </body>
    </html>
  `);

  printWindow.document.close();
  // Small delay to let content render before print dialog
  setTimeout(() => printWindow.print(), 300);
}

/** Export current filtered threats as CSV */
export function exportThreatsCsv(threats: ThreatItem[]): void {
  /** Quote and escape a CSV cell, preventing formula injection */
  const csvCell = (v: string): string => {
    // Prefix formula-triggering characters to prevent CSV injection in spreadsheet apps
    let safe = v;
    if (/^[=+\-@\t\r]/.test(safe)) safe = `'${safe}`;
    if (/[,"\n\r]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
    return safe;
  };

  const headers = ['CVE ID', 'Title', 'Severity', 'CVSS Score', 'Source', 'Published', 'Status', 'CISA KEV', 'URL'];
  const rows = threats.map((t) => [
    csvCell(t.cveId ?? ''),
    csvCell(t.title || ''),
    csvCell(t.severity),
    csvCell(t.cvssScore?.toString() ?? ''),
    csvCell(t.source),
    csvCell(t.publishedAt),
    csvCell(t.status),
    csvCell(t.cisaKev ? 'Yes' : 'No'),
    csvCell(t.url ?? ''),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const date = new Date().toISOString().split('T')[0];
  downloadFile(csv, `socc-threats-${date}.csv`, 'text/csv;charset=utf-8');
}
