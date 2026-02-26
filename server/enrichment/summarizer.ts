/**
 * Article enrichment — fetches a web page and extracts a TL;DR summary.
 * Uses meta tags, Open Graph, and first paragraph text extraction.
 * No LLM required — purely extraction-based.
 */

interface EnrichResult {
  tldr: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

const UA = 'Mozilla/5.0 (compatible; SOCCBot/1.0)';

/** Extract text content between HTML tags, stripping nested tags */
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract meta content by name or property */
function extractMeta(html: string, attr: string): string | null {
  // Match both name="..." and property="..."
  const patterns = [
    new RegExp(`<meta[^>]*(?:name|property)=["']${attr}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']${attr}["']`, 'i'),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

/** Extract first meaningful paragraphs from HTML */
function extractParagraphs(html: string, maxChars = 500): string {
  const paragraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const texts: string[] = [];
  let total = 0;

  for (const p of paragraphs) {
    const text = stripHtml(p).trim();
    // Skip short/boilerplate paragraphs
    if (text.length < 40) continue;
    if (/cookie|subscribe|sign up|newsletter|advertisement/i.test(text)) continue;
    texts.push(text);
    total += text.length;
    if (total >= maxChars) break;
  }

  return texts.join(' ');
}

/** Simple keyword-based sentiment from article text */
function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const negWords = /breach|attack|exploit|vulnerability|ransomware|outage|incident|critical|threat|malware|compromise|leak|failure|disruption|downtime/g;
  const posWords = /launch|improve|partner|growth|success|award|innovation|upgrade|enhance|secure|protect|milestone|revenue growth/g;
  const negCount = (lower.match(negWords) || []).length;
  const posCount = (lower.match(posWords) || []).length;
  if (negCount > posCount + 1) return 'negative';
  if (posCount > negCount + 1) return 'positive';
  return 'neutral';
}

/** Truncate to a clean sentence boundary */
function truncateToSentence(text: string, maxLen = 280): string {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastPeriod = cut.lastIndexOf('. ');
  if (lastPeriod > maxLen * 0.4) return cut.slice(0, lastPeriod + 1);
  return cut.trim() + '...';
}

export async function enrichArticle(url: string, title: string, source: string): Promise<EnrichResult> {
  let html = '';

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      html = await res.text();
    }
  } catch {
    // Fetch failed — fall back to title-based summary
  }

  if (html) {
    // Try structured meta first (most reliable)
    const ogDesc = extractMeta(html, 'og:description');
    const metaDesc = extractMeta(html, 'description');
    const twitterDesc = extractMeta(html, 'twitter:description');

    const bestMeta = ogDesc || metaDesc || twitterDesc;

    if (bestMeta && bestMeta.length > 60) {
      return {
        tldr: truncateToSentence(bestMeta),
        sentiment: detectSentiment(bestMeta + ' ' + title),
      };
    }

    // Fall back to paragraph extraction
    const bodyText = extractParagraphs(html);
    if (bodyText.length > 60) {
      return {
        tldr: truncateToSentence(bodyText),
        sentiment: detectSentiment(bodyText),
      };
    }

    // Meta was short but exists — use it
    if (bestMeta) {
      return {
        tldr: bestMeta,
        sentiment: detectSentiment(bestMeta + ' ' + title),
      };
    }
  }

  // Last resort: derive from title
  const sourceLabel = source.charAt(0).toUpperCase() + source.slice(1);
  return {
    tldr: `${sourceLabel} news: ${title}`,
    sentiment: detectSentiment(title),
  };
}
