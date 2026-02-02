/**
 * Protected route wrapper.
 * When auth is enabled and user is not authenticated, shows the login page.
 * When auth is disabled, passes children through unchanged.
 *
 * Usage:
 *   <ProtectedRoute>
 *     <App />
 *   </ProtectedRoute>
 */

import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { LoginPage } from '../components/Auth/LoginPage';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, isAuthenticated } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return <AuthLoadingScreen />;
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

/** Full-screen loading state during auth check */
function AuthLoadingScreen() {
  return (
    <div className="h-screen w-screen bg-socc-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-10 h-10 border-2 border-socc-cyan/20 rounded-full" />
          <div className="absolute inset-0 w-10 h-10 border-2 border-transparent border-t-socc-cyan rounded-full animate-spin" />
        </div>
        <span className="text-xs text-gray-500 font-mono tracking-wider">AUTHENTICATING</span>
      </div>
    </div>
  );
}
