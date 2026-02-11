import { useState, useCallback, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { View } from './types';
import { useAuth } from './auth/AuthContext';
import { usePreferences } from './hooks/usePreferences';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import DashboardLayout from './components/Layout/DashboardLayout';
import Sidebar from './components/Layout/Sidebar';
import DashboardView from './components/Dashboard/DashboardView';
import ThreatFeed from './components/ThreatFeed/ThreatFeed';
import NewsFeed from './components/NewsFeed/NewsFeed';
import StockTracker from './components/StockTracker/StockTracker';
import BriefingPanel from './components/Briefing/BriefingPanel';
import { ShiftNotes } from './components/Notes/ShiftNotes';
import { ProjectTracker } from './components/Projects/ProjectTracker';
import RssSourceManager from './components/Settings/RssSourceManager';
import { PreferencesModal } from './components/Settings/PreferencesModal';
import { DigestSettings } from './components/Settings/DigestSettings';
import KeyboardShortcutsModal from './components/common/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  const { user } = useAuth();
  const { preferences, updatePreferences, togglePanel, resetPreferences } = usePreferences(user?.username ?? null);

  // Use preferred default view if set
  const [activeView, setActiveView] = useState<View>(() => {
    const pref = preferences.defaultView;
    const validViews: View[] = ['dashboard', 'threats', 'news', 'stocks', 'briefings', 'notes', 'projects'];
    return validViews.includes(pref as View) ? (pref as View) : 'dashboard';
  });

  const [lastRefresh] = useState<Date | null>(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showDigest, setShowDigest] = useState(false);

  const toggleSettings = useCallback(() => setShowSettings((v) => !v), []);
  const toggleShortcuts = useCallback(() => setShowShortcuts((v) => !v), []);
  const togglePreferences = useCallback(() => setShowPreferences((v) => !v), []);
  const toggleDigest = useCallback(() => setShowDigest((v) => !v), []);

  /* Wire up keyboard shortcuts */
  useKeyboardShortcuts({
    onToggleShortcutsModal: toggleShortcuts,
    onToggleSettingsModal: useCallback(() => {
      /* Esc should only close, not open */
      setShowSettings(false);
      setShowPreferences(false);
      setShowDigest(false);
    }, []),
    onNavigate: setActiveView,
  });

  /* Shared wrapper for full-page views — padding on outer div avoids h-full + margin overflow */
  const ViewPanel = ({ panelName, children }: { panelName: string; children: ReactNode }) => (
    <div className="h-full p-4">
      <div className="h-full bg-socc-card/20 rounded-2xl border border-socc-border/20 shadow-[var(--socc-card-shadow)] overflow-hidden">
        <ErrorBoundary panelName={panelName}>
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveView} visiblePanels={preferences.visiblePanels} />;
      case 'threats':
        return <ViewPanel panelName="Threat Intel"><ThreatFeed /></ViewPanel>;
      case 'news':
        return <ViewPanel panelName="News Feed"><NewsFeed /></ViewPanel>;
      case 'stocks':
        return <ViewPanel panelName="Stock Tracker"><StockTracker /></ViewPanel>;
      case 'briefings':
        return <ViewPanel panelName="Briefings"><BriefingPanel /></ViewPanel>;
      case 'notes':
        return <ViewPanel panelName="Shift Notes"><ShiftNotes /></ViewPanel>;
      case 'projects':
        return <ViewPanel panelName="Projects"><ProjectTracker /></ViewPanel>;
    }
  };

  return (
    <>
      <DashboardLayout
        onNavigate={setActiveView}
        onToggleSettings={toggleSettings}
        onTogglePreferences={togglePreferences}
        onToggleDigest={toggleDigest}
        sidebar={
          <Sidebar
            activeView={activeView}
            onViewChange={setActiveView}
            lastRefresh={lastRefresh}
            initialCollapsed={preferences.sidebarCollapsed}
          />
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </DashboardLayout>

      {/* Modals */}
      <RssSourceManager open={showSettings} onClose={() => setShowSettings(false)} />
      <KeyboardShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <PreferencesModal
        open={showPreferences}
        onClose={() => setShowPreferences(false)}
        preferences={preferences}
        onUpdate={updatePreferences}
        onTogglePanel={togglePanel}
        onReset={resetPreferences}
      />
      <DigestSettings open={showDigest} onClose={() => setShowDigest(false)} />
    </>
  );
}
