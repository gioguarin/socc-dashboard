import { useMemo } from 'react';
import { Activity, Shield, Newspaper } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { REFRESH_INTERVAL } from '../../utils/constants';
import type { ThreatItem, NewsItem } from '../../types';

interface FeedStatus {
  name: string;
  icon: React.ReactNode;
  lastFetched: Date | null;
  error: string | null;
}

export default function StatusBar() {
  const threats = useApi<ThreatItem[]>('/api/threats', REFRESH_INTERVAL);
  const news = useApi<NewsItem[]>('/api/news', REFRESH_INTERVAL);

  const feeds: FeedStatus[] = useMemo(
    () => [
      { name: 'Threats', icon: <Shield className="w-3 h-3" />, lastFetched: threats.lastFetched, error: threats.error },
      { name: 'News', icon: <Newspaper className="w-3 h-3" />, lastFetched: news.lastFetched, error: news.error },
    ],
    [threats.lastFetched, threats.error, news.lastFetched, news.error]
  );

  const unreviewedThreats = threats.data?.filter((t) => t.status === 'new').length || 0;
  const unreviewedNews = news.data?.filter((n) => n.status === 'new').length || 0;
  const totalUnreviewed = unreviewedThreats + unreviewedNews;

  function formatFeedTime(date: Date | null): string {
    if (!date) return 'pending';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    return `${Math.floor(seconds / 60)}m ago`;
  }

  return (
    <div className="h-8 bg-socc-surface/90 backdrop-blur-sm border-t border-socc-border/20 flex items-center justify-between px-4 text-[10px] text-gray-500 font-mono">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-socc-cyan" />
          <span className="text-gray-400">Feeds</span>
        </div>
        {feeds.map((feed) => (
          <div key={feed.name} className="flex items-center gap-1.5">
            <div className="relative">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  feed.error ? 'bg-red-500' : feed.lastFetched ? 'bg-green-500' : 'bg-gray-600'
                }`}
              />
              {!feed.error && feed.lastFetched && (
                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-green-500 animate-ping opacity-30" />
              )}
            </div>
            {feed.icon}
            <span>
              {feed.name}: {feed.error ? 'error' : formatFeedTime(feed.lastFetched)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {totalUnreviewed > 0 && (
          <span className="text-amber-400">
            {totalUnreviewed} unreviewed item{totalUnreviewed !== 1 ? 's' : ''}
          </span>
        )}
        <span className="text-[10px] text-gray-600 px-2 py-0.5 rounded-full bg-socc-bg/50 border border-socc-border/20">
          SOCC v1.0
        </span>
      </div>
    </div>
  );
}
