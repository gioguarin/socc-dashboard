/**
 * Auth middleware for Express.
 *
 * When SOCC_AUTH_ENABLED=true, protects API routes by requiring a valid
 * session token (via httpOnly cookie or Authorization header).
 * When auth is disabled, all requests pass through unmodified.
 *
 * TODO: Add rate limiting on auth endpoints to prevent brute force.
 * TODO: Add IP-based lockout after N failed attempts.
 * TODO: Support OAuth/SSO bearer tokens from external providers.
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from './token.js';

/** Extend Express Request with auth user info */
declare global {
  namespace Express {
    interface Request {
      authUser?: TokenPayload;
    }
  }
}

/**
 * Parse cookies from the raw Cookie header.
 * Avoids needing cookie-parser dependency.
 */
function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  header.split(';').forEach((cookie) => {
    const eqIndex = cookie.indexOf('=');
    if (eqIndex === -1) return;
    const name = cookie.substring(0, eqIndex).trim();
    const value = cookie.substring(eqIndex + 1).trim();
    cookies[name] = value;
  });
  return cookies;
}

/**
 * Extract token from request — checks httpOnly cookie first, then Authorization header.
 */
function extractToken(req: Request): string | null {
  // 1. Check httpOnly cookie
  const cookies = parseCookies(req.headers.cookie);
  if (cookies['socc_token']) return cookies['socc_token'];

  // 2. Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Auth guard middleware. When auth is enabled, rejects unauthenticated requests with 401.
 * Auth endpoints (/api/auth/*) are always exempt.
 */
export function authGuard(req: Request, res: Response, next: NextFunction): void {
  const authEnabled = process.env.SOCC_AUTH_ENABLED === 'true';

  // If auth is disabled, pass through
  if (!authEnabled) {
    next();
    return;
  }

  // Auth endpoints are always accessible
  if (req.path.startsWith('/api/auth')) {
    next();
    return;
  }

  // Non-API routes (static files) are always accessible
  if (!req.path.startsWith('/api/')) {
    next();
    return;
  }

  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // Attach user info to request
  req.authUser = payload;
  next();
}

/**
 * Helper to get the current auth user from a request.
 * Works whether auth is enabled or not — returns null when auth is disabled.
 */
export function getAuthUser(req: Request): TokenPayload | null {
  // If auth is disabled, try to read token anyway (for user display)
  const token = extractToken(req);
  if (!token) return null;
  return verifyToken(token);
}
