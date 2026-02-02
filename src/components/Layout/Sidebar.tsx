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
      className="h-full bg-socc-surface/60 border-r border-socc-border/30 flex flex-col relative z-10"
    >
      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {NAV_ITEMS.map(({ view, icon: Icon, label }) => {
          const isActive = activeView === view;
          return (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 relative overflow-hidden
                ${isActive
                  ? 'bg-socc-cyan/10 text-socc-cyan'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-socc-hover/50'
                }
              `}
              title={collapsed ? label : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-socc-cyan rounded-r"
                  transition={{ duration: 0.2 }}
                />
              )}
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="truncate"
                >
                  {label}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-3 border-t border-socc-border/20">
        {/* Connection status */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          {!collapsed && (
            <span className="text-[10px] text-gray-500 truncate">Connected</span>
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
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-socc-surface border border-socc-border/50 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors z-20"
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
