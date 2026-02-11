import { useState, useEffect } from 'react';
import { Shield, Bell, Settings, Rss, LogOut, User, Coffee } from 'lucide-react';
import { formatCurrentTime, isOnShift } from '../../utils/formatters';
import { useApiWithAnomaly } from '../../hooks/useApiWithAnomaly';
import { REFRESH_INTERVAL } from '../../utils/constants';
import type { ThreatItem, NewsItem, View } from '../../types';
import { useAuth } from '../../auth/AuthContext';
import GlobalSearch from '../Search/GlobalSearch';
import { ThemeSelector } from '../Settings/ThemeSelector';

interface HeaderProps {
  onNavigate: (view: View) => void;
  onToggleSettings: () => void;
  onTogglePreferences: () => void;
  onToggleDigest?: () => void;
}

export default function Header({ onNavigate, onToggleSettings, onTogglePreferences, onToggleDigest }: HeaderProps) {
  const { user, authEnabled, logout } = useAuth();
  const [time, setTime] = useState(formatCurrentTime());
  const [onShift, setOnShift] = useState(isOnShift());
  const threats = useApiWithAnomaly<ThreatItem[]>('/api/threats', REFRESH_INTERVAL);
  const news = useApiWithAnomaly<NewsItem[]>('/api/news', REFRESH_INTERVAL);

  /* Count items from the last 24 hours as actionable notifications */
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const newThreats = threats.data?.filter((t) => new Date(t.publishedAt).getTime() > oneDayAgo).length || 0;
  const newNews = news.data?.filter((n) => new Date(n.publishedAt).getTime() > oneDayAgo).length || 0;
  const notifCount = newThreats + newNews;

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatCurrentTime());
      setOnShift(isOnShift());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 bg-socc-surface/90 backdrop-blur-md border-b border-socc-border/20 shadow-[0_1px_3px_rgba(0,0,0,0.2)] flex items-center justify-between px-4 z-20">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-socc-cyan/20 to-indigo-500/10 border border-socc-cyan/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-socc-cyan" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-socc-cyan rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-200 tracking-wide leading-none">
              SOCC
            </span>
            <span className="text-[9px] font-medium text-socc-cyan/80 tracking-widest uppercase leading-none mt-0.5">
              Dashboard
            </span>
          </div>
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-mono text-gray-400 tabular-nums tracking-tight">{time}</span>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
            onShift
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
          }`}
        >
          <div className="relative">
            <div className={`w-1.5 h-1.5 rounded-full ${onShift ? 'bg-green-400' : 'bg-gray-500'}`} />
            {onShift && <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-green-400 animate-ping opacity-40" />}
          </div>
          {onShift ? 'On Shift' : 'Off Duty'}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <GlobalSearch onNavigate={onNavigate} />
        <button
          onClick={() => onNavigate('threats')}
          className="relative p-2 rounded-lg hover:bg-socc-hover/80 transition-all duration-200 text-gray-400 hover:text-gray-200"
          title={notifCount > 0 ? `${notifCount} unreviewed items` : 'No new alerts'}
        >
          <Bell className="w-4 h-4" />
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1 ring-2 ring-socc-surface">
              {notifCount}
            </span>
          )}
        </button>
        <ThemeSelector />
        {onToggleDigest && (
          <button
            onClick={onToggleDigest}
            className="p-2 rounded-lg hover:bg-socc-hover/80 transition-all duration-200 text-gray-400 hover:text-gray-200"
            title="Briefing Settings"
          >
            <Coffee className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onToggleSettings}
          className="p-2 rounded-lg hover:bg-socc-hover/80 transition-all duration-200 text-gray-400 hover:text-gray-200"
          title="RSS Sources"
        >
          <Rss className="w-4 h-4" />
        </button>
        <button
          onClick={onTogglePreferences}
          className="p-2 rounded-lg hover:bg-socc-hover/80 transition-all duration-200 text-gray-400 hover:text-gray-200"
          title="Preferences"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User info — shown when auth is enabled and user is logged in */}
        {authEnabled && user && (
          <div className="flex items-center gap-2 ml-1 pl-2 border-l border-socc-border/30">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-socc-cyan/10 border border-socc-cyan/30 flex items-center justify-center">
                <User className="w-3 h-3 text-socc-cyan" />
              </div>
              <div className="hidden sm:block">
                <span className="text-[11px] text-gray-300 font-medium">{user.username}</span>
                <span className="text-[9px] text-gray-600 ml-1.5 uppercase">{user.role}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200 text-gray-500 hover:text-red-400"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
