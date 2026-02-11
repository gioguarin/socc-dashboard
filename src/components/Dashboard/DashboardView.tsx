import { useState, useCallback, useMemo } from 'react';
import {
  ResponsiveGridLayout,
  useContainerWidth,
} from 'react-grid-layout';
import type { LayoutItem, Layout, ResponsiveLayouts } from 'react-grid-layout';
import { RotateCcw, GripVertical } from 'lucide-react';
import type { View } from '../../types';
import type { DashboardPanel } from '../../auth/types';
import { ErrorBoundary } from '../common/ErrorBoundary';
import ThreatFeed from '../ThreatFeed/ThreatFeed';
import NewsFeed from '../NewsFeed/NewsFeed';
import StockTracker from '../StockTracker/StockTracker';
import BriefingPanel from '../Briefing/BriefingPanel';
import { CalendarWidget } from '../Calendar/CalendarWidget';
import { QuickLinksPanel } from '../QuickLinks/QuickLinksPanel';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import 'react-grid-layout/css/styles.css';

interface DashboardViewProps {
  onNavigate: (view: View) => void;
  visiblePanels?: DashboardPanel[];
}

const ALL_PANELS: DashboardPanel[] = ['threats', 'news', 'stocks', 'briefings', 'calendar', 'quicklinks'];

const PANEL_LABELS: Record<DashboardPanel, string> = {
  threats: 'Threat Intel',
  news: 'News Feed',
  stocks: 'Stock Tracker',
  briefings: 'Briefings',
  calendar: 'Calendar',
  quicklinks: 'Quick Links',
};

function mkItem(i: string, x: number, y: number, w: number, h: number, minW = 1, minH = 2): LayoutItem {
  return { i, x, y, w, h, minW, minH };
}

const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: [
    mkItem('threats', 0, 0, 2, 6, 1, 3),
    mkItem('calendar', 2, 0, 1, 4, 1, 3),
    mkItem('quicklinks', 2, 4, 1, 2),
    mkItem('news', 0, 6, 2, 5),
    mkItem('stocks', 2, 6, 1, 5),
    mkItem('briefings', 0, 11, 3, 4),
  ],
  md: [
    mkItem('threats', 0, 0, 2, 5, 1, 3),
    mkItem('calendar', 0, 5, 1, 3),
    mkItem('quicklinks', 1, 5, 1, 3),
    mkItem('news', 0, 8, 2, 4),
    mkItem('stocks', 0, 12, 1, 4),
    mkItem('briefings', 1, 12, 1, 4),
  ],
  sm: [
    mkItem('threats', 0, 0, 1, 5, 1, 3),
    mkItem('calendar', 0, 5, 1, 3),
    mkItem('news', 0, 8, 1, 4),
    mkItem('quicklinks', 0, 12, 1, 3),
    mkItem('stocks', 0, 15, 1, 4),
    mkItem('briefings', 0, 19, 1, 4),
  ],
};

const LAYOUT_STORAGE_KEY = 'socc-dashboard-layout-v2';

export default function DashboardView({ onNavigate, visiblePanels }: DashboardViewProps) {
  const panels = visiblePanels ?? ALL_PANELS;
  const [savedLayouts, setSavedLayouts] = useLocalStorage<ResponsiveLayouts>(LAYOUT_STORAGE_KEY, DEFAULT_LAYOUTS);
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(savedLayouts);
  const [isEdited, setIsEdited] = useState(false);

  const { containerRef, width } = useContainerWidth({ initialWidth: 1200 });

  // Filter layouts to only include visible panels
  const filteredLayouts = useMemo(() => {
    const filtered: ResponsiveLayouts = {};
    for (const [bp, layout] of Object.entries(layouts)) {
      if (layout) {
        filtered[bp] = layout.filter((item: LayoutItem) => panels.includes(item.i as DashboardPanel));
      }
    }
    return filtered;
  }, [layouts, panels]);

  const handleLayoutChange = useCallback((_layout: Layout, allLayouts: ResponsiveLayouts) => {
    setLayouts(allLayouts);
    setSavedLayouts(allLayouts);
    setIsEdited(true);
  }, [setSavedLayouts]);

  const handleResetLayout = useCallback(() => {
    setLayouts(DEFAULT_LAYOUTS);
    setSavedLayouts(DEFAULT_LAYOUTS);
    setIsEdited(false);
  }, [setSavedLayouts]);

  const renderPanel = (panel: DashboardPanel) => {
    switch (panel) {
      case 'threats':
        return (
          <ErrorBoundary panelName="Threat Intel">
            <ThreatFeed compact maxItems={6} onViewAll={() => onNavigate('threats')} />
          </ErrorBoundary>
        );
      case 'news':
        return (
          <ErrorBoundary panelName="News Feed">
            <NewsFeed compact maxItems={8} onViewAll={() => onNavigate('news')} />
          </ErrorBoundary>
        );
      case 'stocks':
        return (
          <ErrorBoundary panelName="Stock Tracker">
            <StockTracker compact onViewAll={() => onNavigate('stocks')} />
          </ErrorBoundary>
        );
      case 'briefings':
        return (
          <ErrorBoundary panelName="Briefings">
            <BriefingPanel compact maxItems={1} onViewAll={() => onNavigate('briefings')} />
          </ErrorBoundary>
        );
      case 'calendar':
        return (
          <ErrorBoundary panelName="Calendar">
            <CalendarWidget />
          </ErrorBoundary>
        );
      case 'quicklinks':
        return (
          <ErrorBoundary panelName="Quick Links">
            <QuickLinksPanel compact />
          </ErrorBoundary>
        );
    }
  };

  if (panels.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
        <div className="text-center">
          <p className="mb-1">No dashboard panels visible</p>
          <p className="text-xs text-gray-600">Open Preferences to enable panels</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-2" ref={containerRef as React.RefObject<HTMLDivElement>}>
      {/* Reset layout button */}
      {isEdited && (
        <div className="flex justify-end px-2 pb-1">
          <button
            onClick={handleResetLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold
              text-gray-400 hover:text-socc-cyan bg-socc-surface/60 border border-socc-border/30
              hover:border-socc-cyan/30 hover:bg-socc-cyan/5 transition-all duration-200"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Layout
          </button>
        </div>
      )}

      <ResponsiveGridLayout
        layouts={filteredLayouts}
        breakpoints={{ lg: 1024, md: 768, sm: 0 }}
        cols={{ lg: 3, md: 2, sm: 1 }}
        rowHeight={100}
        width={width}
        margin={[12, 12]}
        containerPadding={[4, 4]}
        onLayoutChange={handleLayoutChange}
        dragConfig={{ handle: '.drag-handle' }}
      >
        {panels.map((panel) => (
          <div
            key={panel}
            className="bg-socc-card/30 border border-socc-border/20 rounded-2xl overflow-hidden
              hover:border-socc-border/40 hover:shadow-[var(--socc-card-shadow-hover)] transition-all duration-300 group"
          >
            {/* Drag handle */}
            <div className="drag-handle absolute top-0 left-0 right-0 h-7 z-10 cursor-grab active:cursor-grabbing
              flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-b-lg bg-socc-surface/90 backdrop-blur-sm border border-t-0 border-socc-border/30 shadow-sm">
                <GripVertical className="w-3 h-3 text-socc-cyan/60" />
                <span className="text-[9px] text-gray-400 font-semibold tracking-wider uppercase">{PANEL_LABELS[panel]}</span>
              </div>
            </div>
            {renderPanel(panel)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
