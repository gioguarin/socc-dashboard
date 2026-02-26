/**
 * Article enrichment — uses Claude Haiku to generate TL;DR summaries.
 * Fetches article HTML for context, sends to Claude for summarization.
 * Falls back to extraction-based summary if no API key or on error.
 */

import Anthropic from '@anthropic-ai/sdk';

interface EnrichResult {
  tldr: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let anthropic: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (anthropic) return anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  anthropic = new Anthropic({ apiKey: key });
  return anthropic;
}

// ─── URL Resolution ─────────────────────────────────────────────

/** Resolve Google News redirect URLs to the actual article URL */
async function resolveUrl(url: string): Promise<string> {
  if (!url.includes('news.google.com') && !url.includes('google.com/rss')) {
    return url;
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
    });

    const location = res.headers.get('location');
    if (location && !location.includes('google.com')) {
      return location;
    }

    if (res.ok || res.status === 200) {
      const html = await res.text();

      const jsRedirect = html.match(/window\.location\.replace\(["']([^"']+)["']\)/);
      if (jsRedirect?.[1] && !jsRedirect[1].includes('google.com')) return jsRedirect[1];

      const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
      if (canonical?.[1] && !canonical[1].includes('google.com')) return canonical[1];

      const ogUrl = html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:url["']/i);
      if (ogUrl?.[1] && !ogUrl[1].includes('google.com')) return ogUrl[1];

      const articleLink = html.match(/<a[^>]*href=["'](https?:\/\/(?!(?:www\.)?google\.com)[^"']+)["'][^>]*data-n-au/i);
      if (articleLink?.[1]) return articleLink[1];
    }
  } catch {
    // Fall through
  }

  return url;
}

// ─── HTML Extraction ────────────────────────────────────────────

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

function extractMeta(html: string, attr: string): string | null {
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

function extractArticleText(html: string, maxChars = 2000): string {
  // Try <article> tag first
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const scope = articleMatch?.[1] || html;

  const paragraphs = scope.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const texts: string[] = [];
  let total = 0;

  for (const p of paragraphs) {
    const text = stripHtml(p).trim();
    if (text.length < 30) continue;
    if (/cookie|subscribe|sign up|newsletter|advertisement|privacy policy/i.test(text)) continue;
    texts.push(text);
    total += text.length;
    if (total >= maxChars) break;
  }

  return texts.join('\n\n');
}

function isGenericDescription(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('comprehensive up-to-date news coverage') ||
    lower.includes('aggregated from sources all over the world') ||
    lower.includes('google news') ||
    lower.includes('sign in to your account') ||
    lower.includes('access denied') ||
    lower.includes('please enable javascript') ||
    text.length < 30
  );
}

// ─── Claude AI Summarization ────────────────────────────────────

async function summarizeWithClaude(
  title: string,
  articleText: string,
  source: string,
): Promise<EnrichResult | null> {
  const client = getClient();
  if (!client) return null;

  // Trim article text to stay within reasonable token limits
  const trimmedText = articleText.slice(0, 3000);

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Summarize this news article in 1-2 concise sentences (max 250 chars). Also classify sentiment as positive, negative, or neutral.

Title: ${title}
Source: ${source}
Article text:
${trimmedText}

Respond in this exact JSON format only, no other text:
{"tldr": "your summary here", "sentiment": "positive|negative|neutral"}`,
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.tldr && typeof parsed.tldr === 'string') {
        return {
          tldr: parsed.tldr.slice(0, 300),
          sentiment: ['positive', 'negative', 'neutral'].includes(parsed.sentiment)
            ? parsed.sentiment
            : 'neutral',
        };
      }
    }
  } catch (err) {
    console.error('Claude enrichment error:', err instanceof Error ? err.message : err);
  }

  return null;
}

// ─── Main Entry Point ───────────────────────────────────────────

export async function enrichArticle(url: string, title: string, source: string): Promise<EnrichResult> {
  // Resolve Google News redirects
  const resolvedUrl = await resolveUrl(url);
  let html = '';
  let articleText = '';

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
    // Fetch failed
  }

  if (html) {
    articleText = extractArticleText(html);

    // Also grab meta descriptions as additional context
    const ogDesc = extractMeta(html, 'og:description') || '';
    const metaDesc = extractMeta(html, 'description') || '';
    if (ogDesc && !isGenericDescription(ogDesc)) {
      articleText = ogDesc + '\n\n' + articleText;
    } else if (metaDesc && !isGenericDescription(metaDesc)) {
      articleText = metaDesc + '\n\n' + articleText;
    }
  }

  // Try Claude AI first (if API key is configured)
  if (articleText.length > 50) {
    const aiResult = await summarizeWithClaude(title, articleText, source);
    if (aiResult) return aiResult;
  }

  // Also try Claude with just the title if we couldn't fetch the article
  if (articleText.length <= 50) {
    const aiResult = await summarizeWithClaude(title, `No article text available. Summarize based on the title.`, source);
    if (aiResult) return aiResult;
  }

  // Fallback: use meta description if available
  if (html) {
    const ogDesc = extractMeta(html, 'og:description');
    const metaDesc = extractMeta(html, 'description');
    const bestMeta = [ogDesc, metaDesc].find(d => d && !isGenericDescription(d) && d.length > 30);
    if (bestMeta) {
      return {
        tldr: bestMeta.length > 280 ? bestMeta.slice(0, 277) + '...' : bestMeta,
        sentiment: 'neutral',
      };
    }
  }

  // Last resort
  const sourceLabel = source.charAt(0).toUpperCase() + source.slice(1);
  return {
    tldr: `${sourceLabel} news: ${title}`,
    sentiment: 'neutral',
  };
}
