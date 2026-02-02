/**
 * Auth types and adapter interfaces.
 *
 * Architecture:
 * ┌─────────────────────────────────────────────────────┐
 * │                   AuthContext                        │
 * │  (React Context — provides useAuth() to all comps)  │
 * │                                                     │
 * │  ┌─────────────────────────────────────────────┐    │
 * │  │           AuthAdapter (interface)            │    │
 * │  │  - login(username, password)                 │    │
 * │  │  - logout()                                  │    │
 * │  │  - getStatus()                               │    │
 * │  └─────────────┬───────────────────────────────┘    │
 * │                │ (swappable)                        │
 * │  ┌─────────────┴───────────────────────────────┐    │
 * │  │        ApiAuthAdapter (default)              │    │
 * │  │  Calls /api/auth/* endpoints                 │    │
 * │  │  Uses httpOnly cookies for sessions          │    │
 * │  └─────────────────────────────────────────────┘    │
 * │                                                     │
 * │  TODO: Future adapters:                             │
 * │  - OAuthAdapter (redirect-based, e.g. Google)       │
 * │  - SSOAdapter (SAML/OIDC enterprise)                │
 * │  - Auth0Adapter (hosted auth)                       │
 * │  - FirebaseAdapter (Firebase Auth)                  │
 * └─────────────────────────────────────────────────────┘
 */

/** Authenticated user info */
export interface AuthUser {
  username: string;
  role: 'admin' | 'viewer';
  loginAt: number;
}

/** Auth status returned by the server */
export interface AuthStatus {
  authEnabled: boolean;
  user: AuthUser | null;
}

/** Login credentials for username/password auth */
export interface LoginCredentials {
  username: string;
  password: string;
}

/** Result of a login attempt */
export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/** Full auth state exposed to React components via useAuth() */
export interface AuthState {
  /** Whether the auth system is still loading (checking status) */
  loading: boolean;
  /** Whether auth is enabled on this instance */
  authEnabled: boolean;
  /** Current authenticated user, or null */
  user: AuthUser | null;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Login with username/password */
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  /** Logout and clear session */
  logout: () => Promise<void>;
}

/**
 * Auth adapter interface.
 * Implement this to add a new auth backend (OAuth, SSO, etc).
 *
 * TODO: Add `getAuthUrl()` for OAuth redirect flows.
 * TODO: Add `handleCallback(code: string)` for OAuth callback.
 * TODO: Add `refreshToken()` for token rotation.
 */
export interface AuthAdapter {
  /** Check current auth status (is auth enabled? who is logged in?) */
  getStatus(): Promise<AuthStatus>;
  /** Login with username/password credentials */
  login(credentials: LoginCredentials): Promise<LoginResult>;
  /** Logout and clear session */
  logout(): Promise<void>;
}

/** User preferences stored in localStorage */
export interface UserPreferences {
  /** Panels visible on the dashboard view */
  visiblePanels: DashboardPanel[];
  /** Auto-refresh interval in minutes (5, 10, 15, 30) */
  autoRefreshMinutes: 5 | 10 | 15 | 30;
  /** Whether the sidebar starts collapsed */
  sidebarCollapsed: boolean;
  /** Default view on login/load */
  defaultView: string;
}

/** Dashboard panel identifiers */
export type DashboardPanel =
  | 'threats'
  | 'news'
  | 'stocks'
  | 'briefings'
  | 'calendar'
  | 'quicklinks';

/** All available dashboard panels with display info */
export const DASHBOARD_PANELS: { id: DashboardPanel; label: string }[] = [
  { id: 'threats', label: 'Threat Intel' },
  { id: 'news', label: 'News Feed' },
  { id: 'stocks', label: 'Stock Tracker' },
  { id: 'briefings', label: 'Briefings' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'quicklinks', label: 'Quick Links' },
];

/** Default preferences for new users */
export const DEFAULT_PREFERENCES: UserPreferences = {
  visiblePanels: ['threats', 'news', 'stocks', 'briefings', 'calendar', 'quicklinks'],
  autoRefreshMinutes: 5,
  sidebarCollapsed: false,
  defaultView: 'dashboard',
};
