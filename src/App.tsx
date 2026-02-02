import { useState, useCallback } from 'react';
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

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveView} visiblePanels={preferences.visiblePanels} />;
      case 'threats':
        return (
          <div className="h-full bg-socc-card/20 rounded-xl m-4 border border-socc-border/30 overflow-hidden">
            <ErrorBoundary panelName="Threat Intel">
              <ThreatFeed />
            </ErrorBoundary>
          </div>
        );
      case 'news':
        return (
          <div className="h-full bg-socc-card/20 rounded-xl m-4 border border-socc-border/30 overflow-hidden">
            <ErrorBoundary panelName="News Feed">
              <NewsFeed />
            </ErrorBoundary>
          </div>
        );
      case 'stocks':
        return (
          <div className="h-full bg-socc-card/20 rounded-xl m-4 border border-socc-border/30 overflow-hidden">
            <ErrorBoundary panelName="Stock Tracker">
              <StockTracker />
            </ErrorBoundary>
          </div>
        );
      case 'briefings':
        return (
          <div className="h-full bg-socc-card/20 rounded-xl m-4 border border-socc-border/30 overflow-hidden">
            <ErrorBoundary panelName="Briefings">
              <BriefingPanel />
            </ErrorBoundary>
          </div>
        );
      case 'notes':
        return (
          <div className="h-full bg-socc-card/20 rounded-xl m-4 border border-socc-border/30 overflow-hidden">
            <ErrorBoundary panelName="Shift Notes">
              <ShiftNotes />
            </ErrorBoundary>
          </div>
        );
      case 'projects':
        return (
          <div className="h-full bg-socc-card/20 rounded-xl m-4 border border-socc-border/30 overflow-hidden">
            <ErrorBoundary panelName="Projects">
              <ProjectTracker />
            </ErrorBoundary>
          </div>
        );
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
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
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
