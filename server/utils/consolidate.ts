/**
 * Consolidate duplicate/near-duplicate news articles using Jaccard word-overlap similarity.
 * Groups similar articles under the primary item's `relatedArticles` array.
 */

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'this', 'that', 'it', 'its', 'as',
  'not', 'no', 'so', 'if', 'up', 'out', 'about', 'into', 'over', 'after',
  'than', 'more', 'also', 'just', 'new', 'says', 'said',
]);

const SIMILARITY_THRESHOLD = 0.45;

function tokenize(title: string): Set<string> {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
  return new Set(words);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  relatedArticles?: { title: string; url: string; source: string }[];
  [key: string]: unknown;
}

export function consolidateNews<T extends NewsArticle>(articles: T[]): T[] {
  if (articles.length <= 1) return articles;

  const tokenized = articles.map((a) => ({
    article: a,
    tokens: tokenize(a.title),
  }));

  // Track which articles have been merged into another
  const merged = new Set<number>();
  const result: T[] = [];

  for (let i = 0; i < tokenized.length; i++) {
    if (merged.has(i)) continue;

    const primary = { ...tokenized[i].article };
    const related: { title: string; url: string; source: string }[] = [];

    for (let j = i + 1; j < tokenized.length; j++) {
      if (merged.has(j)) continue;

      const sim = jaccardSimilarity(tokenized[i].tokens, tokenized[j].tokens);
      if (sim >= SIMILARITY_THRESHOLD) {
        related.push({
          title: tokenized[j].article.title,
          url: tokenized[j].article.url,
          source: tokenized[j].article.source,
        });
        merged.add(j);
      }
    }

    if (related.length > 0) {
      primary.relatedArticles = related;
    }
    result.push(primary as T);
  }

  return result;
}
