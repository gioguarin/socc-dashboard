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

  const newThreats = threats.data?.filter((t) => t.status === 'new').length || 0;
  const newNews = news.data?.filter((n) => n.status === 'new').length || 0;
  const notifCount = newThreats + newNews;

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatCurrentTime());
      setOnShift(isOnShift());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-12 bg-socc-surface/80 backdrop-blur-sm border-b border-socc-border/30 flex items-center justify-between px-4 z-20">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Shield className="w-5 h-5 text-socc-cyan" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-socc-cyan rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-semibold text-gray-200 tracking-wide">
            SOCC <span className="text-socc-cyan">Dashboard</span>
          </span>
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center gap-4">
        <span className="text-xs font-mono text-gray-400">{time}</span>
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
            onShift
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${onShift ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          {onShift ? 'On Shift' : 'Off Duty'}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <GlobalSearch onNavigate={onNavigate} />
        <button className="relative p-2 rounded-lg hover:bg-socc-hover transition-colors text-gray-400 hover:text-gray-200">
          <Bell className="w-4 h-4" />
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1">
              {notifCount}
            </span>
          )}
        </button>
        <ThemeSelector />
        {onToggleDigest && (
          <button
            onClick={onToggleDigest}
            className="p-2 rounded-lg hover:bg-socc-hover transition-colors text-gray-400 hover:text-gray-200"
            title="Briefing Settings"
          >
            <Coffee className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onToggleSettings}
          className="p-2 rounded-lg hover:bg-socc-hover transition-colors text-gray-400 hover:text-gray-200"
          title="RSS Sources"
        >
          <Rss className="w-4 h-4" />
        </button>
        <button
          onClick={onTogglePreferences}
          className="p-2 rounded-lg hover:bg-socc-hover transition-colors text-gray-400 hover:text-gray-200"
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
              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-gray-500 hover:text-red-400"
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
