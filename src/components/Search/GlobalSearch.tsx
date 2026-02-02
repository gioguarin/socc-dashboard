import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Shield, Newspaper, TrendingUp, FileText } from 'lucide-react';
import type { ThreatItem, NewsItem, StockData, Briefing, SearchResult, View } from '../../types';
import { useApi } from '../../hooks/useApi';
import { REFRESH_INTERVAL } from '../../utils/constants';
import { searchAll, highlightMatch } from '../../utils/search';

interface GlobalSearchProps {
  onNavigate: (view: View) => void;
}

const TYPE_ICONS = {
  threat: Shield,
  news: Newspaper,
  stock: TrendingUp,
  briefing: FileText,
} as const;

const TYPE_COLORS = {
  threat: 'text-red-400',
  news: 'text-socc-cyan',
  stock: 'text-green-400',
  briefing: 'text-amber-400',
} as const;

export default function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: threats } = useApi<ThreatItem[]>('/api/threats', REFRESH_INTERVAL);
  const { data: news } = useApi<NewsItem[]>('/api/news', REFRESH_INTERVAL);
  const { data: stocks } = useApi<StockData[]>('/api/stocks', REFRESH_INTERVAL);
  const { data: briefings } = useApi<Briefing[]>('/api/briefings', REFRESH_INTERVAL);

  const results = query.trim().length >= 2
    ? searchAll(query, {
        threats: threats || undefined,
        news: news || undefined,
        stocks: stocks || undefined,
        briefings: briefings || undefined,
      })
    : [];

  const showDropdown = focused && query.trim().length >= 2;

  /* Group results by type */
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const handleSelect = useCallback((result: SearchResult) => {
    onNavigate(result.view);
    setQuery('');
    setFocused(false);
    inputRef.current?.blur();
  }, [onNavigate]);

  /* Listen for / keyboard shortcut to focus search */
  useEffect(() => {
    function handleSlash(e: Event) {
      const ce = e as CustomEvent;
      if (ce.detail === 'focus-search') {
        inputRef.current?.focus();
      }
    }
    window.addEventListener('socc-shortcut', handleSlash);
    return () => window.removeEventListener('socc-shortcut', handleSlash);
  }, []);

  /* Close on Escape */
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape' && focused) {
        setQuery('');
        setFocused(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [focused]);

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        <input
          ref={inputRef}
          id="global-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            /* Delay to allow click on result */
            setTimeout(() => setFocused(false), 200);
          }}
          placeholder="Search… ( / )"
          className="w-48 lg:w-64 h-7 pl-8 pr-7 text-xs bg-socc-surface/80 border border-socc-border/40 rounded-md
            text-gray-300 placeholder:text-gray-600
            focus:outline-none focus:border-socc-cyan/40 focus:w-72 transition-all duration-200"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="absolute right-2 text-gray-500 hover:text-gray-300"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 right-0 w-96 max-h-80 overflow-y-auto
              bg-socc-surface border border-socc-border/50 rounded-lg shadow-xl z-50"
          >
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-gray-500">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              <div className="py-1">
                {Object.entries(grouped).map(([type, items]) => {
                  const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS];
                  const color = TYPE_COLORS[type as keyof typeof TYPE_COLORS];
                  return (
                    <div key={type}>
                      <div className="px-3 py-1.5 flex items-center gap-1.5 border-b border-socc-border/20">
                        <Icon className={`w-3 h-3 ${color}`} />
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                          {type}s ({items.length})
                        </span>
                      </div>
                      {items.slice(0, 5).map((result) => (
                        <button
                          key={result.id}
                          onMouseDown={() => handleSelect(result)}
                          className="w-full text-left px-3 py-2 hover:bg-socc-hover/60 transition-colors"
                        >
                          <div
                            className="text-xs text-gray-200 leading-snug truncate"
                            dangerouslySetInnerHTML={{
                              __html: highlightMatch(result.title, query),
                            }}
                          />
                          <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2">
                            <span>{result.subtitle}</span>
                            <span className="text-gray-600">·</span>
                            <span className="text-gray-600">in {result.matchField}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
                <div className="px-3 py-1.5 text-[10px] text-gray-600 border-t border-socc-border/20">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
