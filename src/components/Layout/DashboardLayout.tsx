import { ReactNode } from 'react';
import type { View } from '../../types';
import Header from './Header';
import StatusBar from '../StatusBar/StatusBar';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface DashboardLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  onNavigate: (view: View) => void;
  onToggleSettings: () => void;
  onTogglePreferences: () => void;
  onToggleDigest?: () => void;
}

export default function DashboardLayout({
  sidebar,
  children,
  onNavigate,
  onToggleSettings,
  onTogglePreferences,
  onToggleDigest,
}: DashboardLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-socc-bg overflow-hidden">
      <Header
        onNavigate={onNavigate}
        onToggleSettings={onToggleSettings}
        onTogglePreferences={onTogglePreferences}
        onToggleDigest={onToggleDigest}
      />
      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
      <ErrorBoundary panelName="Status Bar">
        <StatusBar />
      </ErrorBoundary>
    </div>
  );
}
