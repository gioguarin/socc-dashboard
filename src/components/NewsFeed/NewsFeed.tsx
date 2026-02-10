import { useState, useMemo } from 'react';
import { Newspaper } from 'lucide-react';
import { NewsItem } from '../../types';
import { useApiWithAnomaly } from '../../hooks/useApiWithAnomaly';
import { REFRESH_INTERVAL } from '../../utils/constants';
import NewsCard from './NewsCard';
import NewsFilters from './NewsFilters';
import { NewsSkeleton } from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import Badge from '../common/Badge';
import { AnomalyBanner } from '../common/AnomalyBanner';

interface NewsFeedProps {
  compact?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
}

export default function NewsFeed({ compact = false, maxItems, onViewAll }: NewsFeedProps) {
  const { data: news, loading, anomaly } = useApiWithAnomaly<NewsItem[]>('/api/news', REFRESH_INTERVAL);
  const [sourceFilter, setSourceFilter] = useState('all');

  const filtered = useMemo(() => {
    if (!news) return [];
    let result = [...news];
    if (sourceFilter !== 'all') result = result.filter((n) => n.source === sourceFilter);
    result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    if (maxItems) result = result.slice(0, maxItems);
    return result;
  }, [news, sourceFilter, maxItems]);

  const newCount = news?.filter((n) => n.status === 'new').length || 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-socc-border/20 bg-socc-surface/10">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-socc-cyan/10 flex items-center justify-center">
            <Newspaper className="w-3.5 h-3.5 text-socc-cyan" />
          </div>
          <h3 className="text-sm font-semibold text-gray-200">News Feed</h3>
          {newCount > 0 && (
            <Badge className="bg-socc-cyan/10 text-socc-cyan border border-socc-cyan/30">
              {newCount} new
            </Badge>
          )}
        </div>
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

      {/* Anomaly alert banner */}
      <AnomalyBanner anomaly={anomaly} />

      {!compact && (
        <div className="px-4 pt-3">
          <NewsFilters activeSource={sourceFilter} onSourceChange={setSourceFilter} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
        {loading ? (
          <NewsSkeleton count={compact ? 4 : 5} />
        ) : filtered.length === 0 ? (
          <EmptyState message="No news items match filters" />
        ) : (
          filtered.map((item) => <NewsCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
