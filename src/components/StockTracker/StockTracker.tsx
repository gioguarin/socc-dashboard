import { TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { StockRange } from '../../types';
import { useStockDetail } from '../../hooks/useStockDetail';
import StockCardDetail from './StockCardDetail';
import { StockSkeleton } from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import Badge from '../common/Badge';

interface StockTrackerProps {
  compact?: boolean;
  onViewAll?: () => void;
}

const RANGE_OPTIONS: { value: StockRange; label: string }[] = [
  { value: '1d', label: '1D' },
  { value: '5d', label: '1W' },
  { value: '1mo', label: '1M' },
  { value: '3mo', label: '3M' },
  { value: '6mo', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: '2y', label: '2Y' },
];

export default function StockTracker({ compact = false, onViewAll }: StockTrackerProps) {
  const { stocks, loading, error, range, setRange, refresh } = useStockDetail('1mo');

  const sortedStocks = [...stocks].sort((a, b) => {
    if (a.symbol === 'AKAM') return -1;
    if (b.symbol === 'AKAM') return 1;
    return Math.abs(b.changePercent) - Math.abs(a.changePercent);
  });

  const gainers = stocks.filter((s) => s.change > 0).length;
  const losers = stocks.filter((s) => s.change < 0).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-socc-border/20 bg-socc-surface/10">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-socc-cyan/10 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-socc-cyan" />
          </div>
          <h3 className="text-sm font-semibold text-gray-200">Stocks</h3>
          {stocks.length > 0 && (
            <div className="flex items-center gap-1">
              <Badge className="bg-green-500/10 text-green-400 border border-green-500/30 text-[10px]">
                ↑{gainers}
              </Badge>
              <Badge className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px]">
                ↓{losers}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Range selector */}
          <div className="flex items-center bg-socc-card/50 rounded-lg border border-socc-border/30 p-0.5">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`
                  px-2 py-1 text-[10px] font-medium rounded-md transition-all
                  ${range === opt.value
                    ? 'bg-socc-cyan/20 text-socc-cyan'
                    : 'text-gray-400 hover:text-gray-200'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-socc-cyan transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-1 text-xs text-socc-cyan/80 hover:text-socc-cyan font-medium transition-colors group/viewall"
            >
              View All
              <span className="group-hover/viewall:translate-x-0.5 transition-transform">&rarr;</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {loading && stocks.length === 0 ? (
          <StockSkeleton count={compact ? 3 : 6} />
        ) : sortedStocks.length === 0 ? (
          <EmptyState message="No stock data available" />
        ) : (
          <div className={`grid gap-2 ${compact ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3'}`}>
            {sortedStocks.map((stock) => (
              <StockCardDetail key={stock.symbol} stock={stock} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
