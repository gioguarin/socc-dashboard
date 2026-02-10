import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Shield,
  Newspaper,
  TrendingUp,
  FileText,
  StickyNote,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  Wifi,
} from 'lucide-react';
import type { View } from '../../types';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  lastRefresh: Date | null;
  /** Initial collapsed state from user preferences */
  initialCollapsed?: boolean;
}

const NAV_ITEMS: { view: View; icon: typeof LayoutDashboard; label: string }[] = [
  { view: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { view: 'threats', icon: Shield, label: 'Threats' },
  { view: 'news', icon: Newspaper, label: 'News' },
  { view: 'stocks', icon: TrendingUp, label: 'Stocks' },
  { view: 'briefings', icon: FileText, label: 'Briefings' },
  { view: 'notes', icon: StickyNote, label: 'Notes' },
  { view: 'projects', icon: FolderKanban, label: 'Projects' },
];

export default function Sidebar({ activeView, onViewChange, lastRefresh, initialCollapsed = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 192 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full bg-socc-surface/70 backdrop-blur-sm border-r border-socc-border/20 flex flex-col relative z-10"
    >
      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {NAV_ITEMS.map(({ view, icon: Icon, label }) => {
          const isActive = activeView === view;
          return (
            <div key={view} className="relative group/nav">
              <button
                onClick={() => onViewChange(view)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 relative overflow-hidden
                  ${isActive
                    ? 'bg-socc-cyan/10 text-socc-cyan shadow-sm shadow-socc-cyan/5'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-socc-hover/60'
                  }
                `}
              >
                {/* Active indicator — gradient bar */}
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

              {/* Tooltip for collapsed state */}
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

      {/* Bottom section */}
      <div className="px-3 py-3 border-t border-socc-border/20">
        {/* Connection status */}
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

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-socc-surface border border-socc-border/40 shadow-md flex items-center justify-center text-gray-500 hover:text-socc-cyan hover:border-socc-cyan/30 transition-all duration-200 z-20"
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
