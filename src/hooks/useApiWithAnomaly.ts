/**
 * Extended useApi hook that handles API responses with anomaly data.
 * Routes like /api/threats and /api/news now return { data, anomaly }.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Module-level cache survives component unmount/remount
const cache = new Map<string, { data: unknown; anomaly: AnomalyInfo | null; fetchedAt: number }>();

export interface AnomalyInfo {
  detected: boolean;
  type: string;
  currentCount: number;
  averageCount: number;
  multiplier: number;
  message: string;
}

interface UseApiWithAnomalyResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  anomaly: AnomalyInfo | null;
  lastFetched: Date | null;
  refetch: () => void;
}

/**
 * Fetches from an endpoint that returns { data: T[], anomaly: AnomalyInfo | null }.
 * Falls back to treating the whole response as data if no wrapper detected.
 */
export function useApiWithAnomaly<T>(url: string, refreshInterval?: number): UseApiWithAnomalyResult<T> {
  const cached = cache.get(url);
  const [data, setData] = useState<T | null>(cached ? (cached.data as T) : null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [anomaly, setAnomaly] = useState<AnomalyInfo | null>(cached ? cached.anomaly : null);
  const [lastFetched, setLastFetched] = useState<Date | null>(cached ? new Date(cached.fetchedAt) : null);
  const intervalRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}${url}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Non-JSON response');
      }
      const json = await response.json();

      // Handle wrapped response { data, anomaly } or plain array
      if (json && typeof json === 'object' && 'data' in json && Array.isArray(json.data)) {
        setData(json.data as T);
        setAnomaly(json.anomaly ?? null);
        cache.set(url, { data: json.data, anomaly: json.anomaly ?? null, fetchedAt: Date.now() });
      } else {
        setData(json as T);
        setAnomaly(null);
        cache.set(url, { data: json, anomaly: null, fetchedAt: Date.now() });
      }

      setError(null);
      setLastFetched(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();

    if (refreshInterval) {
      intervalRef.current = window.setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, refreshInterval]);

  return { data, loading, error, anomaly, lastFetched, refetch: fetchData };
}
