import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { StockDetailData } from '../../types';
import { formatPrice, formatChange, formatPercent } from '../../utils/formatters';
import StockChart from './StockChart';

interface StockCardDetailProps {
  stock: StockDetailData;
}

function formatMarketCap(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

function formatEarningsDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (diffDays > 0 && diffDays <= 7) {
    return `${formatted} (${diffDays}d)`;
  }
  return formatted;
}

function isEarningsSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= 14;
}

export default function StockCardDetail({ stock }: StockCardDetailProps) {
  const positive = stock.change >= 0;
  const isAkam = stock.symbol === 'AKAM';
  const earningsSoon = isEarningsSoon(stock.earnings.nextEarningsDate);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative overflow-hidden rounded-xl border transition-all duration-300 card-hover-gradient
        ${isAkam
          ? 'bg-socc-cyan/5 border-socc-cyan/20 hover:border-socc-cyan/40 hover:shadow-sm hover:shadow-socc-cyan/5'
          : 'bg-socc-card/50 border-socc-border/30 hover:border-socc-border/50 hover:shadow-[var(--socc-card-shadow-hover)]'
        }
      `}
    >
      {/* Subtle positive/negative tint */}
      <div
        className={`absolute inset-0 opacity-[0.03] ${positive ? 'bg-green-500' : 'bg-red-500'}`}
      />

      <div className="relative p-3">
        {/* Header row */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold font-mono ${isAkam ? 'text-gradient-accent' : 'text-gray-200'}`}>
                {stock.symbol}
              </span>
              {positive ? (
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              )}
              {earningsSoon && (
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-medium rounded border border-amber-500/30">
                  EARNINGS
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-500 block mt-0.5">{stock.name}</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-mono font-bold text-gray-200">
              ${formatPrice(stock.price)}
            </span>
            <div className="flex items-center gap-1.5 justify-end mt-0.5">
              <span className={`text-[10px] font-mono ${positive ? 'text-green-400' : 'text-red-400'}`}>
                {formatChange(stock.change)}
              </span>
              <span className={`text-[10px] font-mono ${positive ? 'text-green-400' : 'text-red-400'}`}>
                ({formatPercent(stock.changePercent)})
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <StockChart data={stock.sparkline} positive={positive} />

        {/* Stats row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-socc-border/20">
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span title="Market Cap">
              <DollarSign className="w-3 h-3 inline mr-0.5 opacity-60" />
              {formatMarketCap(stock.marketCap)}
            </span>
            {stock.high52w && stock.low52w && (
              <span title="52-Week Range" className="hidden sm:inline">
                {formatPrice(stock.low52w)} – {formatPrice(stock.high52w)}
              </span>
            )}
          </div>
        </div>

        {/* Earnings row */}
        {(stock.earnings.nextEarningsDate || stock.earnings.lastEarningsDate) && (
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-socc-border/20 text-[10px]">
            {stock.earnings.nextEarningsDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-500" />
                <span className="text-gray-500">Next:</span>
                <span className={`font-medium ${earningsSoon ? 'text-amber-400' : 'text-gray-400'}`}>
                  {formatEarningsDate(stock.earnings.nextEarningsDate)}
                </span>
              </div>
            )}
            {stock.earnings.lastEarningsDate && (
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Last:</span>
                <span className="text-gray-400">
                  {formatEarningsDate(stock.earnings.lastEarningsDate)}
                </span>
                {stock.earnings.lastEarningsEps !== null && (
                  <span className="text-gray-500">
                    (EPS: ${stock.earnings.lastEarningsEps.toFixed(2)})
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
