/**
 * Preferences / Settings modal.
 * Allows users to configure dashboard panels, refresh rate,
 * sidebar state, and default view.
 */

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, LayoutDashboard, Clock, PanelLeft, Eye } from 'lucide-react';
import type { UserPreferences, DashboardPanel } from '../../auth/types';
import { DASHBOARD_PANELS, DEFAULT_PREFERENCES } from '../../auth/types';
import type { View } from '../../types';

const REFRESH_OPTIONS: { value: UserPreferences['autoRefreshMinutes']; label: string }[] = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
];

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'threats', label: 'Threats' },
  { value: 'news', label: 'News' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'briefings', label: 'Briefings' },
  { value: 'notes', label: 'Notes' },
  { value: 'projects', label: 'Projects' },
];

interface PreferencesModalProps {
  open: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
  onTogglePanel: (panel: DashboardPanel) => void;
  onReset: () => void;
}

export function PreferencesModal({
  open,
  onClose,
  preferences,
  onUpdate,
  onTogglePanel,
  onReset,
}: PreferencesModalProps) {
  const handleRefreshChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate({ autoRefreshMinutes: parseInt(e.target.value, 10) as UserPreferences['autoRefreshMinutes'] });
    },
    [onUpdate],
  );

  const handleDefaultViewChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate({ defaultView: e.target.value });
    },
    [onUpdate],
  );

  const handleSidebarToggle = useCallback(() => {
    onUpdate({ sidebarCollapsed: !preferences.sidebarCollapsed });
  }, [preferences.sidebarCollapsed, onUpdate]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div className="bg-socc-surface border border-socc-border/40 rounded-2xl shadow-[var(--socc-modal-shadow)] w-full max-w-md max-h-[80vh] overflow-hidden pointer-events-auto">
              {/* Gradient accent */}
              <div className="h-[2px] bg-gradient-to-r from-transparent via-socc-cyan/50 to-transparent" />

              <div className="overflow-y-auto max-h-[calc(80vh-2px)]">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-socc-border/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-socc-cyan/10 flex items-center justify-center">
                    <LayoutDashboard className="w-3.5 h-3.5 text-socc-cyan" />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-200">Preferences</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-socc-hover/80 text-gray-500 hover:text-gray-300 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* Dashboard Panels */}
                <section>
                  <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-1.5">
                    <Eye className="w-3 h-3" />
                    Dashboard Panels
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {DASHBOARD_PANELS.map(({ id, label }) => {
                      const active = preferences.visiblePanels.includes(id);
                      return (
                        <button
                          key={id}
                          onClick={() => onTogglePanel(id)}
                          className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                            border transition-all duration-150
                            ${active
                              ? 'bg-socc-cyan/10 text-socc-cyan border-socc-cyan/30'
                              : 'bg-socc-bg/50 text-gray-500 border-socc-border/30 hover:text-gray-400 hover:border-socc-border/50'
                            }
                          `}
                        >
                          <div className={`w-2 h-2 rounded-full ${active ? 'bg-socc-cyan' : 'bg-gray-600'}`} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Auto-Refresh Rate */}
                <section>
                  <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Auto-Refresh Rate
                  </h3>
                  <select
                    value={preferences.autoRefreshMinutes}
                    onChange={handleRefreshChange}
                    className="w-full h-9 px-3 text-xs bg-socc-bg/80 border border-socc-border/50 rounded-lg
                      text-gray-300 focus:outline-none focus:border-socc-cyan/40"
                  >
                    {REFRESH_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </section>

                {/* Default View */}
                <section>
                  <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-1.5">
                    <LayoutDashboard className="w-3 h-3" />
                    Default View
                  </h3>
                  <select
                    value={preferences.defaultView}
                    onChange={handleDefaultViewChange}
                    className="w-full h-9 px-3 text-xs bg-socc-bg/80 border border-socc-border/50 rounded-lg
                      text-gray-300 focus:outline-none focus:border-socc-cyan/40"
                  >
                    {VIEW_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </section>

                {/* Sidebar Default */}
                <section>
                  <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center gap-1.5">
                    <PanelLeft className="w-3 h-3" />
                    Sidebar
                  </h3>
                  <button
                    onClick={handleSidebarToggle}
                    className={`
                      flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium
                      border transition-all duration-150
                      ${preferences.sidebarCollapsed
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-socc-cyan/10 text-socc-cyan border-socc-cyan/30'
                      }
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full ${preferences.sidebarCollapsed ? 'bg-amber-400' : 'bg-socc-cyan'}`} />
                    {preferences.sidebarCollapsed ? 'Start collapsed' : 'Start expanded'}
                  </button>
                </section>

                {/* Reset */}
                <div className="pt-2 border-t border-socc-border/20">
                  <button
                    onClick={onReset}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset to defaults
                  </button>
                </div>
              </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
