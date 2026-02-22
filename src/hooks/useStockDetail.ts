import { useState, useEffect, useCallback } from 'react';
import { StockDetailData, StockRange } from '../types';

interface UseStockDetailResult {
  stocks: StockDetailData[];
  loading: boolean;
  error: string | null;
  range: StockRange;
  setRange: (range: StockRange) => void;
  refresh: () => void;
}

const SYMBOLS = ['AKAM', 'NET', 'FSLY', 'ZS', 'CRWD', 'PANW', 'FFIV'];

export function useStockDetail(initialRange: StockRange = '1mo'): UseStockDetailResult {
  const [stocks, setStocks] = useState<StockDetailData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<StockRange>(initialRange);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const resp = await fetch(`${apiUrl}/api/stocks/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: SYMBOLS, range }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const json = await resp.json();
      if (json.success && Array.isArray(json.data)) {
        setStocks(json.data);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stocks');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  return { stocks, loading, error, range, setRange, refresh: fetchStocks };
}
