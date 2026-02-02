/**
 * Auth context provider.
 * Wraps the app and provides authentication state via useAuth().
 *
 * Behavior:
 * - On mount, checks /api/auth/status to determine if auth is enabled
 * - If auth is disabled (SOCC_AUTH_ENABLED !== true), all routes are accessible
 * - If auth is enabled, user must log in to access protected routes
 * - Auth adapter is swappable (default: ApiAuthAdapter)
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { AuthState, AuthUser, LoginCredentials, LoginResult, AuthAdapter } from './types';
import { ApiAuthAdapter } from './adapters/apiAdapter';

const AuthContext = createContext<AuthState | null>(null);

/** Default adapter instance — can be swapped via AuthProvider props */
const defaultAdapter = new ApiAuthAdapter();

interface AuthProviderProps {
  children: ReactNode;
  /** Override the auth adapter (for testing or alternative auth backends) */
  adapter?: AuthAdapter;
}

export function AuthProvider({ children, adapter = defaultAdapter }: AuthProviderProps) {
  const [loading, setLoading] = useState(true);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Check auth status on mount
  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      try {
        const status = await adapter.getStatus();
        if (cancelled) return;

        setAuthEnabled(status.authEnabled);
        setUser(status.user);
      } catch {
        // If we can't reach the server, assume auth is off
        if (!cancelled) {
          setAuthEnabled(false);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    checkStatus();
    return () => { cancelled = true; };
  }, [adapter]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    const result = await adapter.login(credentials);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  }, [adapter]);

  const logout = useCallback(async () => {
    await adapter.logout();
    setUser(null);
  }, [adapter]);

  const isAuthenticated = !authEnabled || user !== null;

  const value = useMemo<AuthState>(() => ({
    loading,
    authEnabled,
    user,
    isAuthenticated,
    login,
    logout,
  }), [loading, authEnabled, user, isAuthenticated, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state from any component.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
