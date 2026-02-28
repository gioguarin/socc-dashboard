import { useEffect, useRef, useState } from 'react';
import { Activity, Shield, Newspaper } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { REFRESH_INTERVAL } from '../../utils/constants';
import type { ThreatItem, NewsItem } from '../../types';

const THREE_HOURS = 3 * 60 * 60 * 1000;
const STORAGE_KEY = 'socc-feed-timestamps';

interface PersistedTimestamps {
  threats: { changedAt: number; count: number };
  news: { changedAt: number; count: number };
}

function loadTimestamps(): PersistedTimestamps | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveTimestamps(ts: PersistedTimestamps) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ts));
}

function formatRelative(date: Date | null, now: number): string {
  if (!date) return '--:--';
  const diff = now - date.getTime();
  if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < THREE_HOURS) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function StatusBar() {
  const threats = useApi<ThreatItem[]>('/api/threats', REFRESH_INTERVAL);
  const news = useApi<NewsItem[]>('/api/news', REFRESH_INTERVAL);

  // Tick to re-render relative timestamps
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  // Restore persisted timestamps & counts on mount
  const persisted = useRef(loadTimestamps());

  const prevThreats = useRef<number>(persisted.current?.threats.count ?? 0);
  const prevNews = useRef<number>(persisted.current?.news.count ?? 0);
  const [threatDelta, setThreatDelta] = useState(0);
  const [newsDelta, setNewsDelta] = useState(0);
  const [threatsChanged, setThreatsChanged] = useState<Date | null>(
    persisted.current ? new Date(persisted.current.threats.changedAt) : null,
  );
  const [newsChanged, setNewsChanged] = useState<Date | null>(
    persisted.current ? new Date(persisted.current.news.changedAt) : null,
  );

  useEffect(() => {
    if (threats.data) {
      const len = threats.data.length;
      if (prevThreats.current === 0) {
        // First-ever load (no persisted data) — snapshot count, set timestamp
        const ts = new Date();
        setThreatsChanged(ts);
        prevThreats.current = len;
        saveTimestamps({
          threats: { changedAt: ts.getTime(), count: len },
          news: { changedAt: newsChanged?.getTime() ?? ts.getTime(), count: prevNews.current },
        });
      } else if (len !== prevThreats.current) {
        const delta = len - prevThreats.current;
        setThreatDelta(delta);
        const ts = new Date();
        setThreatsChanged(ts);
        prevThreats.current = len;
        saveTimestamps({
          threats: { changedAt: ts.getTime(), count: len },
          news: { changedAt: newsChanged?.getTime() ?? Date.now(), count: prevNews.current },
        });
      }
    }
  }, [threats.data]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (news.data) {
      const len = news.data.length;
      if (prevNews.current === 0) {
        const ts = new Date();
        setNewsChanged(ts);
        prevNews.current = len;
        saveTimestamps({
          threats: { changedAt: threatsChanged?.getTime() ?? ts.getTime(), count: prevThreats.current },
          news: { changedAt: ts.getTime(), count: len },
        });
      } else if (len !== prevNews.current) {
        const delta = len - prevNews.current;
        setNewsDelta(delta);
        const ts = new Date();
        setNewsChanged(ts);
        prevNews.current = len;
        saveTimestamps({
          threats: { changedAt: threatsChanged?.getTime() ?? Date.now(), count: prevThreats.current },
          news: { changedAt: ts.getTime(), count: len },
        });
      }
    }
  }, [news.data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build-time timestamp baked in by Vite at deploy
  const buildTime = new Date(__BUILD_TIME__);

  return (
    <div className="h-8 bg-socc-surface/90 backdrop-blur-sm border-t border-socc-border/20 flex items-center justify-between px-4 text-[10px] text-gray-500 font-mono">
      {/* Left: per-feed status with relative times and counts */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-socc-cyan" />
          <span className="text-gray-400">Feeds</span>
        </div>

        {/* Threats */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <div className={`w-1.5 h-1.5 rounded-full ${threats.error ? 'bg-red-500' : threats.lastFetched ? 'bg-green-500' : 'bg-gray-600'}`} />
            {!threats.error && threats.lastFetched && (
              <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-green-500 animate-ping opacity-30" />
            )}
          </div>
          <Shield className="w-3 h-3" />
          <span>
            Threats: {threats.error ? 'error' : `${threats.data?.length ?? 0} items · ${formatRelative(threatsChanged, now)}`}
          </span>
          {threatDelta > 0 && <span className="text-green-400">+{threatDelta}</span>}
        </div>

        {/* News */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <div className={`w-1.5 h-1.5 rounded-full ${news.error ? 'bg-red-500' : news.lastFetched ? 'bg-green-500' : 'bg-gray-600'}`} />
            {!news.error && news.lastFetched && (
              <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-green-500 animate-ping opacity-30" />
            )}
          </div>
          <Newspaper className="w-3 h-3" />
          <span>
            News: {news.error ? 'error' : `${news.data?.length ?? 0} items · ${formatRelative(newsChanged, now)}`}
          </span>
          {newsDelta > 0 && <span className="text-green-400">+{newsDelta}</span>}
        </div>
      </div>

      {/* Right: version badge with relative last-update */}
      <div className="flex items-center gap-2">
        <span className="text-gray-600">
          Deployed {formatRelative(buildTime, now)}
        </span>
        <span className="text-[10px] text-gray-600 px-2 py-0.5 rounded-full bg-socc-bg/50 border border-socc-border/20">
          SOCC v1.0
        </span>
      </div>
    </div>
  );
}
