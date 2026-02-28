import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Module-level cache survives component unmount/remount
const cache = new Map<string, { data: unknown; fetchedAt: number }>();

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  refetch: () => void;
}

export function useApi<T>(url: string, refreshInterval?: number): UseApiResult<T> {
  const cached = cache.get(url);
  const [data, setData] = useState<T | null>(cached ? (cached.data as T) : null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
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
      /* Unwrap API responses that wrap the payload in a `data` key (e.g. { data, anomaly } or { success, data }) */
      const payload = json != null && typeof json === 'object' && !Array.isArray(json) && 'data' in json
        ? json.data
        : json;
      setData(payload);
      setError(null);
      const now = new Date();
      setLastFetched(now);
      cache.set(url, { data: payload, fetchedAt: now.getTime() });
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

  return { data, loading, error, lastFetched, refetch: fetchData };
}
