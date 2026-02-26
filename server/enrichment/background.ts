/**
 * Background enrichment job — pre-generates TL;DR summaries for all
 * news articles that don't have one yet. Runs on a timer so public
 * users never trigger Claude API calls directly.
 */

import { readDataFile, writeDataFile } from '../utils.js';
import { enrichArticle } from './summarizer.js';

let running = false;

/** Enrich all articles missing a TL;DR, with a batch limit per run */
async function enrichBatch(batchSize = 5): Promise<number> {
  if (running) return 0;
  running = true;

  try {
    const news = readDataFile('news.json', []);
    const needsEnrichment = news.filter(
      (item: { tldr?: string }) => !item.tldr
    );

    if (needsEnrichment.length === 0) return 0;

    const batch = needsEnrichment.slice(0, batchSize);
    let enriched = 0;

    for (const article of batch) {
      try {
        const result = await enrichArticle(article.url, article.title, article.source);
        article.tldr = result.tldr;
        if (result.sentiment) article.sentiment = result.sentiment;
        enriched++;
        // Small delay between API calls to be respectful
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.error(`Enrichment failed for ${article.id}:`, err instanceof Error ? err.message : err);
      }
    }

    if (enriched > 0) {
      writeDataFile('news.json', news);
      console.log(`📝 Enriched ${enriched}/${needsEnrichment.length} articles with AI summaries`);
    }

    return enriched;
  } finally {
    running = false;
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

/** Start background enrichment on a timer */
export function startBackgroundEnrichment(intervalMs = 60_000): void {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⏭️  No ANTHROPIC_API_KEY — background enrichment disabled');
    return;
  }

  console.log(`📝 Background enrichment started (every ${intervalMs / 1000}s, 5 articles per batch)`);

  // Run once immediately on startup
  enrichBatch().catch(() => {});

  intervalId = setInterval(() => {
    enrichBatch().catch(() => {});
  }, intervalMs);
}

export function stopBackgroundEnrichment(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
