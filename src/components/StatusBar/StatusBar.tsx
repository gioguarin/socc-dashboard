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

  /* Count items published in the last 24 hours as "recent" */
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentThreats = threats.data?.filter((t) => new Date(t.publishedAt).getTime() > oneDayAgo).length || 0;
  const recentNews = news.data?.filter((n) => new Date(n.publishedAt).getTime() > oneDayAgo).length || 0;
  const totalRecent = recentThreats + recentNews;

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
        {totalRecent > 0 && (
          <span className="text-amber-400">
            {totalRecent} new in last 24h
          </span>
        )}
        <span className="text-[10px] text-gray-600 px-2 py-0.5 rounded-full bg-socc-bg/50 border border-socc-border/20">
          SOCC v1.0
        </span>
      </div>
    </div>
  );
}
