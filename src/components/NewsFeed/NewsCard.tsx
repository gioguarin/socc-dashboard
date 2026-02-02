import { motion } from 'framer-motion';
import { ExternalLink, Flag, Eye, EyeOff } from 'lucide-react';
import { NewsItem } from '../../types';
import { SOURCE_COLORS, SOURCE_LABELS, CATEGORY_LABELS } from '../../utils/constants';
import { timeAgo } from '../../utils/formatters';
import { analyzeSentiment, SENTIMENT_CONFIG } from '../../utils/sentiment';

interface NewsCardProps {
  item: NewsItem;
}

export default function NewsCard({ item }: NewsCardProps) {
  const sourceColor = SOURCE_COLORS[item.source] || SOURCE_COLORS.general;
  const isDimmed = item.status === 'reviewed' || item.status === 'dismissed';
  const isFlagged = item.status === 'flagged';

  /* Compute sentiment from item data or use pre-computed value */
  const sentiment = item.sentiment || analyzeSentiment(item.title, item.summary);
  const sentimentCfg = SENTIMENT_CONFIG[sentiment];

  return (
    <motion.div
      data-item
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative pl-4 py-2.5 pr-3 border-l-2 transition-all duration-200 hover:bg-socc-hover/40 rounded-r-md ${
        isFlagged
          ? 'border-l-amber-500 bg-amber-500/5'
          : isDimmed
          ? 'border-l-gray-700 opacity-50 hover:opacity-80'
          : 'border-l-socc-border/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${sourceColor}`}>
              {SOURCE_LABELS[item.source]}
            </span>
            <span className="text-[10px] text-gray-600 uppercase">
              {CATEGORY_LABELS[item.category]}
            </span>
            {/* Sentiment badge */}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${sentimentCfg.bg} ${sentimentCfg.color} ${sentimentCfg.border}`}
              title={`Sentiment: ${sentimentCfg.label}`}
            >
              {sentimentCfg.icon} {sentimentCfg.label}
            </span>
            <span className="text-[10px] text-gray-600">{timeAgo(item.publishedAt)}</span>
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-200 hover:text-socc-cyan transition-colors leading-snug inline-flex items-center gap-1"
          >
            {item.title}
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
          </a>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.summary}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1 rounded hover:bg-socc-border/30 text-gray-500 hover:text-amber-400 transition-colors" title="Flag">
            <Flag className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 rounded hover:bg-socc-border/30 text-gray-500 hover:text-green-400 transition-colors" title="Mark reviewed">
            {isDimmed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Status indicators */}
      {item.status === 'new' && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[3px] w-2 h-2 rounded-full bg-socc-cyan animate-pulse" />
      )}
    </motion.div>
  );
}
