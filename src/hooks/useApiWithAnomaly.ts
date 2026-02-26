/**
 * Extended useApi hook that handles API responses with anomaly data.
 * Routes like /api/threats and /api/news now return { data, anomaly }.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anomaly, setAnomaly] = useState<AnomalyInfo | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
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
      } else {
        setData(json as T);
        setAnomaly(null);
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
