import { useMemo } from 'react';
import { SOURCE_LABELS, SOURCE_COLORS, CATEGORY_LABELS } from '../../utils/constants';
import type { NewsItem } from '../../types';

interface NewsFiltersProps {
  activeSource: string;
  onSourceChange: (source: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  items: NewsItem[];
}

const SOURCE_GROUPS = [
  { label: 'Vendors', keys: ['akamai', 'cloudflare', 'crowdstrike', 'paloalto', 'zscaler', 'fastly', 'f5'] },
  { label: 'AI', keys: ['openai', 'anthropic', 'google_ai', 'meta_ai', 'microsoft_ai'] },
  { label: 'Other', keys: ['world', 'general'] },
];

const CATEGORIES = ['all', 'product', 'security', 'business', 'research', 'incident', 'ai'] as const;

export default function NewsFilters({
  activeSource,
  onSourceChange,
  activeCategory,
  onCategoryChange,
  items,
}: NewsFiltersProps) {
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.source] = (counts[item.source] || 0) + 1;
    }
    return counts;
  }, [items]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [items]);

  return (
    <div className="space-y-3">
      {/* ── Category segmented control ── */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-socc-surface/40 border border-socc-border/15 overflow-x-auto scrollbar-thin">
        {CATEGORIES.map((c) => {
          const isActive = activeCategory === c;
          const count = c === 'all' ? items.length : categoryCounts[c] || 0;
          return (
            <button
              key={c}
              onClick={() => onCategoryChange(c)}
              className={`
                relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap
                transition-all duration-200
                ${isActive
                  ? 'bg-socc-cyan/15 text-socc-cyan shadow-[0_0_12px_rgba(0,255,255,0.08)]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                }
              `}
            >
              {c === 'all' ? 'All' : CATEGORY_LABELS[c] || c}
              {count > 0 && (
                <span className={`
                  text-[9px] font-bold tabular-nums min-w-[18px] text-center px-1 py-px rounded-full
                  ${isActive
                    ? 'bg-socc-cyan/20 text-socc-cyan'
                    : 'bg-white/[0.06] text-gray-600'
                  }
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Source chips ── */}
      <div className="flex items-start gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {/* All sources pill */}
        <button
          onClick={() => onSourceChange('all')}
          className={`
            shrink-0 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider
            transition-all duration-200 border
            ${activeSource === 'all'
              ? 'bg-socc-cyan/12 text-socc-cyan border-socc-cyan/25'
              : 'bg-transparent text-gray-500 border-socc-border/20 hover:text-gray-300 hover:border-socc-border/40'
            }
          `}
        >
          All
        </button>

        {/* Grouped source chips */}
        {SOURCE_GROUPS.map((group) => {
          const hasItems = group.keys.some((k) => (sourceCounts[k] || 0) > 0);
          return (
            <div key={group.label} className="flex items-center gap-1 shrink-0">
              <span className={`text-[9px] uppercase tracking-widest font-medium mr-0.5 ${
                hasItems ? 'text-gray-600' : 'text-gray-700'
              }`}>
                {group.label}
              </span>
              {group.keys.map((s) => {
                const isActive = activeSource === s;
                const count = sourceCounts[s] || 0;
                const colorClass = SOURCE_COLORS[s] || SOURCE_COLORS.general;

                return (
                  <button
                    key={s}
                    onClick={() => onSourceChange(s)}
                    className={`
                      flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap
                      transition-all duration-200 border
                      ${isActive
                        ? `${colorClass} shadow-[0_0_10px_rgba(255,255,255,0.04)]`
                        : count > 0
                          ? 'bg-transparent text-gray-500 border-transparent hover:text-gray-300 hover:border-socc-border/30'
                          : 'bg-transparent text-gray-700 border-transparent opacity-50 hover:opacity-75'
                      }
                    `}
                  >
                    {SOURCE_LABELS[s] || s}
                    {count > 0 && (
                      <span className={`
                        text-[8px] font-bold tabular-nums min-w-[14px] text-center px-0.5 rounded
                        ${isActive ? 'opacity-80' : 'text-gray-600'}
                      `}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
