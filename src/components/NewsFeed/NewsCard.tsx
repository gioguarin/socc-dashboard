import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Flag, Eye, EyeOff, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import { NewsItem } from '../../types';
import { SOURCE_COLORS, SOURCE_LABELS, CATEGORY_LABELS } from '../../utils/constants';
import { timeAgo } from '../../utils/formatters';
import { analyzeSentiment, SENTIMENT_CONFIG } from '../../utils/sentiment';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface NewsCardProps {
  item: NewsItem;
}

export default function NewsCard({ item }: NewsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [tldr, setTldr] = useState(item.tldr || '');
  const [enriching, setEnriching] = useState(false);
  const sourceColor = SOURCE_COLORS[item.source] || SOURCE_COLORS.general;
  const isDimmed = item.status === 'reviewed' || item.status === 'dismissed';
  const isFlagged = item.status === 'flagged';

  const sentiment = item.sentiment || analyzeSentiment(item.title, item.summary);
  const sentimentCfg = SENTIMENT_CONFIG[sentiment];

  const hasTldr = Boolean(tldr);
  const hasDetails = true; // Always expandable

  const fetchTldr = useCallback(async () => {
    if (tldr || enriching) return;
    setEnriching(true);
    try {
      const res = await fetch(`${API_BASE}/api/news/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      });
      if (res.ok) {
        const json = await res.json();
        const data = json?.data ?? json;
        if (data.tldr) setTldr(data.tldr);
      }
    } catch {
      // Silently fail — article still shows without TL;DR
    } finally {
      setEnriching(false);
    }
  }, [item.id, tldr, enriching]);

  return (
    <motion.div
      layout
      data-item
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative pl-4 py-3 pr-3 border-l-[3px] transition-all duration-300 hover:bg-socc-hover/30 rounded-r-lg ${
        isFlagged
          ? 'border-l-amber-500 bg-amber-500/5'
          : isDimmed
          ? 'border-l-gray-700/50 opacity-50 hover:opacity-80'
          : 'border-l-socc-border/40 hover:border-l-socc-cyan/40'
      }`}
    >
      <div
        className="cursor-pointer"
        onClick={() => {
          const willExpand = !expanded;
          setExpanded(willExpand);
          if (willExpand && !tldr) fetchTldr();
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${sourceColor}`}>
                {SOURCE_LABELS[item.source]}
              </span>
              <span className="text-[10px] text-gray-600 uppercase">
                {CATEGORY_LABELS[item.category]}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${sentimentCfg.bg} ${sentimentCfg.color} ${sentimentCfg.border}`}
                title={`Sentiment: ${sentimentCfg.label}`}
              >
                {sentimentCfg.icon} {sentimentCfg.label}
              </span>
              {hasTldr && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />
                  AI Summary
                </span>
              )}
              <span className="text-[10px] text-gray-600">{timeAgo(item.publishedAt)}</span>
            </div>
            <h4 className="text-sm font-medium text-gray-200 leading-snug">{item.title}</h4>
            {!expanded && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-1 leading-relaxed">{item.summary}</p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="p-1 rounded hover:bg-socc-border/30 text-gray-500 hover:text-amber-400 transition-colors"
                title="Flag"
                onClick={(e) => e.stopPropagation()}
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1 rounded hover:bg-socc-border/30 text-gray-500 hover:text-green-400 transition-colors"
                title="Mark reviewed"
                onClick={(e) => e.stopPropagation()}
              >
                {isDimmed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {hasDetails && (
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Expandable detail section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 pt-2 border-t border-socc-border/20">
              {/* AI-generated TL;DR */}
              {enriching && (
                <div className="mb-2.5 px-3 py-2 rounded-md bg-purple-500/5 border border-purple-500/15">
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                    <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                      Fetching summary...
                    </span>
                  </div>
                </div>
              )}
              {hasTldr && !enriching && (
                <div className="mb-2.5 px-3 py-2 rounded-md bg-purple-500/5 border border-purple-500/15">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                      TL;DR
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{tldr}</p>
                </div>
              )}

              {/* Original description */}
              <p className="text-xs text-gray-500 leading-relaxed">{item.summary}</p>

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-socc-cyan hover:text-cyan-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Read full article
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent indicator dot — published within last 24h */}
      {Date.now() - new Date(item.publishedAt).getTime() < 24 * 60 * 60 * 1000 && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[3px]">
          <div className="w-2 h-2 rounded-full bg-socc-cyan" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-socc-cyan animate-ping opacity-40" />
        </div>
      )}
    </motion.div>
  );
}
