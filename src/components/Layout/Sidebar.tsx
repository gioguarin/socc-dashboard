import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Shield,
  Newspaper,
  TrendingUp,
  FileText,
  StickyNote,
  FolderKanban,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Wifi,
  Settings,
  Rss,
  Coffee,
  Bell,
} from 'lucide-react';
import type { View } from '../../types';
import { ThemeSelector } from '../Settings/ThemeSelector';
import AnalogClock from './AnalogClock';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  lastRefresh: Date | null;
  initialCollapsed?: boolean;
  onNavSelect?: () => void;
  onToggleSettings: () => void;
  onTogglePreferences: () => void;
  onToggleDigest?: () => void;
  onNavigateAlerts: () => void;
}

const NAV_ITEMS: { view: View; icon: typeof LayoutDashboard; label: string }[] = [
  { view: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { view: 'threats', icon: Shield, label: 'Threats' },
  { view: 'news', icon: Newspaper, label: 'News' },
  { view: 'stocks', icon: TrendingUp, label: 'Stocks' },
  { view: 'briefings', icon: FileText, label: 'Briefings' },
  { view: 'notes', icon: StickyNote, label: 'Notes' },
  { view: 'projects', icon: FolderKanban, label: 'Projects' },
  { view: 'calendar', icon: Calendar, label: 'Calendar' },
];

export default function Sidebar({
  activeView,
  onViewChange,
  lastRefresh,
  initialCollapsed = false,
  onNavSelect,
  onToggleSettings,
  onTogglePreferences,
  onToggleDigest,
  onNavigateAlerts,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleNavClick = (view: View) => {
    onViewChange(view);
    onNavSelect?.();
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 220 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full bg-socc-surface/70 backdrop-blur-sm border-r border-socc-border/20 flex flex-col relative z-10"
    >
      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
        {NAV_ITEMS.map(({ view, icon: Icon, label }) => {
          const isActive = activeView === view;
          return (
            <div key={view} className="relative group/nav">
              <button
                onClick={() => handleNavClick(view)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 relative overflow-hidden
                  ${isActive
                    ? 'bg-socc-cyan/10 text-socc-cyan shadow-sm shadow-socc-cyan/5'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-socc-hover/60'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-socc-cyan to-indigo-400 rounded-r-full"
                    transition={{ duration: 0.2 }}
                  />
                )}
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${!isActive ? 'group-hover/nav:text-socc-cyan/70' : ''}`} />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.15 }}
                    className="truncate"
                  >
                    {label}
                  </motion.span>
                )}
              </button>

              {collapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-socc-surface border border-socc-border/50 shadow-lg text-xs text-gray-200 whitespace-nowrap opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-opacity duration-200 z-50">
                  {label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-socc-surface" />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Analog clock */}
      <div className="border-t border-socc-border/20">
        <AnalogClock collapsed={collapsed} />
      </div>

      {/* Settings section */}
      <div className="border-t border-socc-border/20">
        {collapsed ? (
          /* Collapsed: single gear icon that opens settings menu */
          <div className="px-2 py-2 space-y-1">
            <div className="relative group/settings">
              <button
                onClick={() => { onTogglePreferences(); onNavSelect?.(); }}
                className="w-full flex items-center justify-center p-2.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-socc-hover/60 transition-all"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-socc-surface border border-socc-border/50 shadow-lg text-xs text-gray-200 whitespace-nowrap opacity-0 pointer-events-none group-hover/settings:opacity-100 transition-opacity duration-200 z-50">
                Settings
              </div>
            </div>
          </div>
        ) : (
          /* Expanded: collapsible settings section */
          <div className="px-2 py-2">
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-socc-hover/60 transition-all"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="truncate">Settings</span>
              <ChevronDown className={`w-3.5 h-3.5 ml-auto shrink-0 transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="py-1 space-y-0.5 pl-2">
                    <button
                      onClick={() => { onNavigateAlerts(); onNavSelect?.(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-socc-hover/60 transition-all"
                    >
                      <Bell className="w-3.5 h-3.5 shrink-0" />
                      <span>Alerts</span>
                    </button>
                    <button
                      onClick={() => { onToggleSettings(); onNavSelect?.(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-socc-hover/60 transition-all"
                    >
                      <Rss className="w-3.5 h-3.5 shrink-0" />
                      <span>RSS Sources</span>
                    </button>
                    <button
                      onClick={() => { onTogglePreferences(); onNavSelect?.(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-socc-hover/60 transition-all"
                    >
                      <Settings className="w-3.5 h-3.5 shrink-0" />
                      <span>Preferences</span>
                    </button>
                    {onToggleDigest && (
                      <button
                        onClick={() => { onToggleDigest(); onNavSelect?.(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-socc-hover/60 transition-all"
                      >
                        <Coffee className="w-3.5 h-3.5 shrink-0" />
                        <span>Briefing Settings</span>
                      </button>
                    )}
                    {/* Theme selector */}
                    <div className="px-3 py-2">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2 block">Theme</span>
                      <ThemeSelector />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom status */}
      <div className="px-3 py-3 border-t border-socc-border/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30" />
          </div>
          {!collapsed && (
            <span className="text-[10px] text-green-400/70 font-medium truncate">Connected</span>
          )}
        </div>
        {!collapsed && lastRefresh && (
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <Wifi className="w-3 h-3" />
            <span>
              Last refresh:{' '}
              {lastRefresh.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        )}
      </div>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-socc-surface border border-socc-border/40 shadow-md items-center justify-center text-gray-500 hover:text-socc-cyan hover:border-socc-cyan/30 transition-all duration-200 z-20"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </motion.aside>
  );
}
