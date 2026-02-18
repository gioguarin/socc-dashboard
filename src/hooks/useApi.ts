import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  refetch: () => void;
}

export function useApi<T>(url: string, refreshInterval?: number): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const intervalRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}${url}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      /* Unwrap API responses that wrap the payload in a `data` key (e.g. { data, anomaly } or { success, data }) */
      const payload = json != null && typeof json === 'object' && !Array.isArray(json) && 'data' in json
        ? json.data
        : json;
      setData(payload);
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

  return { data, loading, error, lastFetched, refetch: fetchData };
}
