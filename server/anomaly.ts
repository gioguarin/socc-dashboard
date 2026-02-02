/**
 * Anomaly detection for volume spikes.
 * Compares today's count against a 7-day rolling average.
 * Returns anomaly info when current volume exceeds 2x the average.
 */

import { getDb } from './db/index.js';

export interface AnomalyInfo {
  detected: boolean;
  type: string;
  currentCount: number;
  averageCount: number;
  multiplier: number;
  message: string;
}

/** Spike threshold — flag when current count exceeds average by this factor */
const SPIKE_THRESHOLD = 2.0;

/** Rolling window in days for the baseline average */
const ROLLING_WINDOW_DAYS = 7;

/**
 * Detect anomalous volume spikes for a given data type.
 * Compares today's ingested count against the 7-day rolling average.
 */
export function detectAnomaly(type: 'threats' | 'news'): AnomalyInfo | null {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    // Get today's count
    const todayRow = db.prepare(
      'SELECT count FROM daily_counts WHERE date = ? AND type = ?'
    ).get(today, type) as { count: number } | undefined;

    const currentCount = todayRow?.count ?? 0;
    if (currentCount === 0) return null;

    // Get rolling average (excluding today)
    const avgRow = db.prepare(`
      SELECT AVG(count) as avg_count FROM daily_counts
      WHERE type = ? AND date >= date('now', ?) AND date < ?
    `).get(type, `-${ROLLING_WINDOW_DAYS} days`, today) as { avg_count: number | null } | undefined;

    const averageCount = avgRow?.avg_count ?? 0;

    // No historical data yet — can't detect anomalies
    if (averageCount === 0) return null;

    const multiplier = Math.round((currentCount / averageCount) * 10) / 10;

    if (multiplier >= SPIKE_THRESHOLD) {
      const label = type === 'threats' ? 'threat' : 'news';
      return {
        detected: true,
        type,
        currentCount,
        averageCount: Math.round(averageCount),
        multiplier,
        message: `⚡ Unusual ${label} volume detected — ${multiplier}x above ${ROLLING_WINDOW_DAYS}-day average`,
      };
    }

    return null;
  } catch {
    // Anomaly detection is non-critical
    return null;
  }
}
