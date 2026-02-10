import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { StockData } from '../../types';
import { formatPrice, formatChange, formatPercent } from '../../utils/formatters';
import StockChart from './StockChart';

interface StockCardProps {
  stock: StockData;
}

export default function StockCard({ stock }: StockCardProps) {
  const positive = stock.change >= 0;
  const isAkam = stock.symbol === 'AKAM';

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
            </div>
            <span className="text-[10px] text-gray-500 block mt-0.5">{stock.name}</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-mono font-bold text-gray-200">
              ${formatPrice(stock.price)}
            </span>
          </div>
        </div>

        <StockChart data={stock.sparkline} positive={positive} />

        <div className="flex items-center justify-between mt-1">
          <span className={`text-xs font-mono ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {formatChange(stock.change)}
          </span>
          <span className={`text-xs font-mono ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercent(stock.changePercent)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
