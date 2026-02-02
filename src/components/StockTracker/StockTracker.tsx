import { TrendingUp } from 'lucide-react';
import { StockData } from '../../types';
import { useApi } from '../../hooks/useApi';
import { REFRESH_INTERVAL } from '../../utils/constants';
import StockCard from './StockCard';
import { StockSkeleton } from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import Badge from '../common/Badge';

interface StockTrackerProps {
  compact?: boolean;
  onViewAll?: () => void;
}

export default function StockTracker({ compact = false, onViewAll }: StockTrackerProps) {
  const { data: stocks, loading } = useApi<StockData[]>('/api/stocks', REFRESH_INTERVAL);

  const sortedStocks = stocks
    ? [...stocks].sort((a, b) => {
        if (a.symbol === 'AKAM') return -1;
        if (b.symbol === 'AKAM') return 1;
        return Math.abs(b.changePercent) - Math.abs(a.changePercent);
      })
    : [];

  const gainers = stocks?.filter((s) => s.change > 0).length || 0;
  const losers = stocks?.filter((s) => s.change < 0).length || 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-socc-border/30">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-socc-cyan" />
          <h3 className="text-sm font-semibold text-gray-200">Stocks</h3>
          {stocks && (
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
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs text-socc-cyan hover:text-cyan-300 transition-colors">
            View All →
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <StockSkeleton count={compact ? 3 : 6} />
        ) : sortedStocks.length === 0 ? (
          <EmptyState message="No stock data available" />
        ) : (
          <div className={`grid gap-2 ${compact ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'}`}>
            {sortedStocks.map((stock) => (
              <StockCard key={stock.symbol} stock={stock} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
