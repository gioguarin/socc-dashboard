import { ReactNode } from 'react';
import type { View } from '../../types';
import Header from './Header';
import StatusBar from '../StatusBar/StatusBar';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface DashboardLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  onNavigate: (view: View) => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export default function DashboardLayout({
  sidebar,
  children,
  onNavigate,
  mobileMenuOpen,
  onToggleMobileMenu,
}: DashboardLayoutProps) {
  return (
    <div className="h-[100dvh] flex flex-col bg-socc-bg overflow-hidden">
      <Header
        onNavigate={onNavigate}
        onToggleMobileMenu={onToggleMobileMenu}
        mobileMenuOpen={mobileMenuOpen}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={onToggleMobileMenu}
          />
        )}
        <div
          className={`
            fixed inset-y-0 left-0 z-40 pt-14 transition-transform duration-200 ease-in-out md:relative md:pt-0 md:z-10 md:translate-x-0
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {sidebar}
        </div>
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
      <ErrorBoundary panelName="Status Bar">
        <StatusBar />
      </ErrorBoundary>
    </div>
  );
}
