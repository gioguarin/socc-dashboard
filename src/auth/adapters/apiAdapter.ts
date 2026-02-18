/**
 * API-based auth adapter.
 * Communicates with the Express /api/auth/* endpoints.
 * Uses httpOnly cookies for session persistence.
 *
 * This is the default adapter for local/env-var authentication.
 * TODO: Create OAuthAdapter for redirect-based OAuth flows.
 * TODO: Create SSOAdapter for SAML/OIDC enterprise auth.
 */

import type { AuthAdapter, AuthStatus, LoginCredentials, LoginResult } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export class ApiAuthAdapter implements AuthAdapter {
  async getStatus(): Promise<AuthStatus> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/status`, { credentials: 'include' });
      if (!res.ok) {
        return { authEnabled: false, user: null };
      }
      return (await res.json()) as AuthStatus;
    } catch {
      // Network error — assume auth is not available, allow through
      return { authEnabled: false, user: null };
    }
  }

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        return {
          success: false,
          error: data.error || `Login failed (HTTP ${res.status})`,
        };
      }

      const data = (await res.json()) as { user: AuthStatus['user'] };
      return {
        success: true,
        user: data.user ?? undefined,
      };
    } catch {
      return {
        success: false,
        error: 'Network error — unable to reach server',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Swallow — logout is best-effort
    }
  }
}
