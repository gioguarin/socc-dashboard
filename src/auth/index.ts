/**
 * Auth module barrel exports.
 *
 * Auth Architecture Overview:
 * ─────────────────────────────
 * The auth system is designed with a pluggable adapter pattern:
 *
 * 1. AuthProvider (React Context) wraps the entire app
 * 2. An AuthAdapter handles communication with the auth backend
 * 3. ProtectedRoute gates access when auth is enabled
 * 4. useAuth() hook gives components access to auth state
 *
 * Currently implemented:
 * - ApiAuthAdapter: env-var username/password via /api/auth/* endpoints
 *
 * To add a new auth provider:
 * 1. Create a new class implementing AuthAdapter (see auth/types.ts)
 * 2. Pass it to <AuthProvider adapter={yourAdapter}>
 * 3. Add any needed server routes (e.g., OAuth callback)
 *
 * TODO: OAuthAdapter — redirect-based OAuth2 (Google, GitHub, etc.)
 * TODO: SSOAdapter — SAML/OIDC enterprise single sign-on
 * TODO: Auth0Adapter — hosted auth with Auth0/Okta
 * TODO: FirebaseAdapter — Firebase Authentication
 */

export { AuthProvider, useAuth } from './AuthContext';
export { ProtectedRoute } from './ProtectedRoute';
export type {
  AuthUser,
  AuthState,
  AuthStatus,
  AuthAdapter,
  LoginCredentials,
  LoginResult,
  UserPreferences,
  DashboardPanel,
} from './types';
export { DEFAULT_PREFERENCES, DASHBOARD_PANELS } from './types';
