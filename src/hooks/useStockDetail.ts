import { useState, useEffect, useCallback } from 'react';
import { StockDetailData, StockData, StockRange } from '../types';

interface UseStockDetailResult {
  stocks: StockDetailData[];
  loading: boolean;
  error: string | null;
  range: StockRange;
  setRange: (range: StockRange) => void;
  refresh: () => void;
}

const SYMBOLS = ['AKAM', 'NET', 'FSLY', 'ZS', 'CRWD', 'PANW', 'FFIV'];

// Module-level cache survives component unmount/remount
let cachedStocks: StockDetailData[] | null = null;

/** Convert basic StockData to StockDetailData with null detail fields */
function toDetailData(s: StockData): StockDetailData {
  return {
    symbol: s.symbol,
    name: s.name,
    price: s.price,
    change: s.change,
    changePercent: s.changePercent,
    range: '',
    sparkline: s.sparkline || [],
    timestamps: [],
    high52w: null,
    low52w: null,
    marketCap: null,
    volume: null,
    avgVolume: null,
    earnings: {
      lastEarningsDate: null,
      nextEarningsDate: null,
      lastEarningsEps: null,
      lastEarningsRevenue: null,
    },
    lastUpdated: s.lastUpdated,
  };
}

export function useStockDetail(initialRange: StockRange = '1mo'): UseStockDetailResult {
  const [stocks, setStocks] = useState<StockDetailData[]>(cachedStocks || []);
  const [loading, setLoading] = useState(!cachedStocks);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<StockRange>(initialRange);

  const fetchStocks = useCallback(async () => {
    if (!cachedStocks) setLoading(true);
    setError(null);

    const apiUrl = import.meta.env.VITE_API_URL || '';

    try {
      // Try the batch endpoint first (available on Linode, has detailed data)
      const resp = await fetch(`${apiUrl}/api/stocks/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: SYMBOLS, range }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const json = await resp.json();
      if (json.success && Array.isArray(json.data)) {
        setStocks(json.data);
        cachedStocks = json.data;
        return;
      }
      throw new Error('Invalid response');
    } catch {
      // Fall back to the basic /api/stocks endpoint (available on Fermyon)
      try {
        const resp = await fetch(`${apiUrl}/api/stocks`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const json = await resp.json();
        const data: StockData[] = json.success && Array.isArray(json.data) ? json.data : json;

        if (Array.isArray(data) && data.length > 0) {
          const detailed = data.map(toDetailData);
          setStocks(detailed);
          cachedStocks = detailed;
          return;
        }
        throw new Error('No stock data');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stocks');
      }
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  return { stocks, loading, error, range, setRange, refresh: fetchStocks };
}
