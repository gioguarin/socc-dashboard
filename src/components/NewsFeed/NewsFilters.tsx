import { SOURCE_LABELS, SOURCE_COLORS } from '../../utils/constants';

interface NewsFiltersProps {
  activeSource: string;
  onSourceChange: (source: string) => void;
}

const SOURCES = ['all', 'akamai', 'cloudflare', 'crowdstrike', 'paloalto', 'zscaler', 'fastly', 'f5', 'general'];

export default function NewsFilters({ activeSource, onSourceChange }: NewsFiltersProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
      {SOURCES.map((s) => {
        const isActive = activeSource === s;
        const colorClass = s !== 'all' ? SOURCE_COLORS[s] : '';
        return (
          <button
            key={s}
            onClick={() => onSourceChange(s)}
            className={`
              px-2 py-1 rounded text-[10px] uppercase tracking-wider font-medium whitespace-nowrap
              transition-all duration-150 border
              ${isActive
                ? s === 'all'
                  ? 'bg-socc-cyan/10 text-socc-cyan border-socc-cyan/30'
                  : colorClass
                : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300 hover:border-socc-border/30'
              }
            `}
          >
            {s === 'all' ? 'All' : SOURCE_LABELS[s] || s}
          </button>
        );
      })}
    </div>
  );
}
