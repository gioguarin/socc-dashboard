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
import { CalendarView } from './components/Calendar/CalendarView';
import RssSourceManager from './components/Settings/RssSourceManager';
import { PreferencesModal } from './components/Settings/PreferencesModal';
import { DigestSettings } from './components/Settings/DigestSettings';
import KeyboardShortcutsModal from './components/common/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  const { user } = useAuth();
  const { preferences, updatePreferences, togglePanel, resetPreferences } = usePreferences(user?.username ?? null);

  const [activeView, setActiveView] = useState<View>(() => {
    const pref = preferences.defaultView;
    const validViews: View[] = ['dashboard', 'threats', 'news', 'stocks', 'briefings', 'notes', 'projects', 'calendar'];
    return validViews.includes(pref as View) ? (pref as View) : 'dashboard';
  });

  const [lastRefresh] = useState<Date | null>(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showDigest, setShowDigest] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSettings = useCallback(() => setShowSettings((v) => !v), []);
  const toggleShortcuts = useCallback(() => setShowShortcuts((v) => !v), []);
  const togglePreferences = useCallback(() => setShowPreferences((v) => !v), []);
  const toggleDigest = useCallback(() => setShowDigest((v) => !v), []);
  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((v) => !v), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const navigateAlerts = useCallback(() => {
    setActiveView('threats');
    setMobileMenuOpen(false);
  }, []);

  useKeyboardShortcuts({
    onToggleShortcutsModal: toggleShortcuts,
    onToggleSettingsModal: useCallback(() => {
      setShowSettings(false);
      setShowPreferences(false);
      setShowDigest(false);
    }, []),
    onNavigate: setActiveView,
  });

  const ViewPanel = ({ panelName, children }: { panelName: string; children: ReactNode }) => (
    <div className="h-full p-2 sm:p-4">
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
      case 'calendar':
        return <ViewPanel panelName="Calendar"><CalendarView /></ViewPanel>;
    }
  };

  return (
    <>
      <DashboardLayout
        onNavigate={setActiveView}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={toggleMobileMenu}
        sidebar={
          <Sidebar
            activeView={activeView}
            onViewChange={setActiveView}
            lastRefresh={lastRefresh}
            initialCollapsed={preferences.sidebarCollapsed}
            onNavSelect={closeMobileMenu}
            onToggleSettings={toggleSettings}
            onTogglePreferences={togglePreferences}
            onToggleDigest={toggleDigest}
            onNavigateAlerts={navigateAlerts}
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
