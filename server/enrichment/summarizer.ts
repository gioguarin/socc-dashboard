/**
 * Article enrichment — fetches a web page and extracts a TL;DR summary.
 * Uses meta tags, Open Graph, and first paragraph text extraction.
 * No LLM required — purely extraction-based.
 */

interface EnrichResult {
  tldr: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Resolve Google News redirect URLs to the actual article URL */
async function resolveUrl(url: string): Promise<string> {
  // Google News RSS URLs use redirects — follow them to get the real URL
  if (!url.includes('news.google.com') && !url.includes('google.com/rss')) {
    return url;
  }

  try {
    // Google News sometimes uses HTTP redirects
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    });

    // Check for HTTP redirect
    const location = res.headers.get('location');
    if (location && !location.includes('google.com')) {
      return location;
    }

    // Some Google News URLs embed the real URL in the page HTML
    if (res.ok || res.status === 200) {
      const html = await res.text();

      // Look for data-redirect or article URL patterns
      const jsRedirect = html.match(/window\.location\.replace\(["']([^"']+)["']\)/);
      if (jsRedirect?.[1] && !jsRedirect[1].includes('google.com')) {
        return jsRedirect[1];
      }

      // Look for the canonical/article link in the page
      const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
      if (canonical?.[1] && !canonical[1].includes('google.com')) {
        return canonical[1];
      }

      // Look for og:url which often has the real article URL
      const ogUrl = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:url["']/i);
      if (ogUrl?.[1] && !ogUrl[1].includes('google.com')) {
        return ogUrl[1];
      }

      // Look for article links in the body
      const articleLink = html.match(/<a[^>]*href=["'](https?:\/\/(?!(?:www\.)?google\.com)[^"']+)["'][^>]*data-n-au/i);
      if (articleLink?.[1]) {
        return articleLink[1];
      }
    }
  } catch {
    // Fall through to original URL
  }

  return url;
}

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

/** Check if a description is generic/useless boilerplate */
function isGenericDescription(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('comprehensive up-to-date news coverage') ||
    lower.includes('aggregated from sources all over the world') ||
    lower.includes('google news') ||
    lower.includes('sign in to your account') ||
    lower.includes('access denied') ||
    lower.includes('please enable javascript') ||
    lower.includes('you need to enable javascript') ||
    text.length < 30
  );
}

export async function enrichArticle(url: string, title: string, source: string): Promise<EnrichResult> {
  // Resolve Google News redirects to actual article URL
  const resolvedUrl = await resolveUrl(url);
  let html = '';

  try {
    const res = await fetch(resolvedUrl, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
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

    // Filter out generic Google News descriptions
    const candidates = [ogDesc, metaDesc, twitterDesc].filter(
      (d): d is string => !!d && !isGenericDescription(d)
    );
    const bestMeta = candidates.find(d => d.length > 60) || candidates[0];

    if (bestMeta && bestMeta.length > 30) {
      return {
        tldr: truncateToSentence(bestMeta),
        sentiment: detectSentiment(bestMeta + ' ' + title),
      };
    }

    // Fall back to paragraph extraction
    const bodyText = extractParagraphs(html);
    if (bodyText.length > 60 && !isGenericDescription(bodyText)) {
      return {
        tldr: truncateToSentence(bodyText),
        sentiment: detectSentiment(bodyText),
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
