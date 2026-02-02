/**
 * Auth API routes.
 *
 * Provides login, logout, and session status endpoints.
 * Currently uses environment-variable credentials (SOCC_ADMIN_USER / SOCC_ADMIN_PASS).
 *
 * TODO: Replace env-var auth with a proper auth provider (OAuth, SSO, LDAP).
 * TODO: Add /api/auth/register for multi-user support.
 * TODO: Add /api/auth/refresh for token rotation.
 * TODO: Add /api/auth/providers for listing available OAuth providers.
 */

import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { createToken, verifyToken } from '../auth/token.js';

const router = Router();

/** Cookie options for the session token */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
};

/**
 * GET /api/auth/status
 * Returns whether auth is enabled and the current user (if authenticated).
 */
router.get('/status', (req: Request, res: Response) => {
  const authEnabled = process.env.SOCC_AUTH_ENABLED === 'true';

  // Try to read existing session
  let user = null;
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce<Record<string, string>>((acc, c) => {
      const eqIdx = c.indexOf('=');
      if (eqIdx !== -1) {
        acc[c.substring(0, eqIdx).trim()] = c.substring(eqIdx + 1).trim();
      }
      return acc;
    }, {});

    const token = cookies['socc_token'];
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        user = {
          username: payload.username,
          role: payload.role,
          loginAt: payload.loginAt,
        };
      }
    }
  }

  res.json({ authEnabled, user });
});

/**
 * POST /api/auth/login
 * Authenticate with username/password.
 * Credentials are validated against SOCC_ADMIN_USER and SOCC_ADMIN_PASS env vars.
 */
router.post('/login', (req: Request, res: Response) => {
  const authEnabled = process.env.SOCC_AUTH_ENABLED === 'true';
  if (!authEnabled) {
    res.status(400).json({ error: 'Authentication is not enabled' });
    return;
  }

  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const adminUser = process.env.SOCC_ADMIN_USER;
  const adminPass = process.env.SOCC_ADMIN_PASS;

  if (!adminUser || !adminPass) {
    console.error('❌ SOCC_ADMIN_USER and SOCC_ADMIN_PASS must be set when auth is enabled');
    res.status(500).json({ error: 'Server authentication not configured' });
    return;
  }

  // Timing-safe comparison to prevent timing attacks
  const usernameMatch =
    username.length === adminUser.length &&
    crypto.timingSafeEqual(Buffer.from(username), Buffer.from(adminUser));

  const passwordMatch =
    password.length === adminPass.length &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPass));

  if (!usernameMatch || !passwordMatch) {
    // Small delay to deter brute force
    setTimeout(() => {
      res.status(401).json({ error: 'Invalid credentials' });
    }, 500 + Math.random() * 500);
    return;
  }

  // Create session token — admin role for env-var user
  const token = createToken(username, 'admin');

  // Set httpOnly cookie
  res.cookie('socc_token', token, COOKIE_OPTIONS);

  res.json({
    user: {
      username,
      role: 'admin' as const,
      loginAt: Date.now(),
    },
  });
});

/**
 * POST /api/auth/logout
 * Clear the session cookie.
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('socc_token', { path: '/' });
  res.json({ success: true });
});

export default router;
