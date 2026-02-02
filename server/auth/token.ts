/**
 * Lightweight JWT-like token utilities using Node's built-in crypto.
 * No external dependencies — tokens are HMAC-SHA256 signed.
 *
 * Architecture Note:
 * This is the simplest possible token implementation for Phase 4.
 * TODO: Replace with a battle-tested JWT library (e.g. jose) for production.
 * TODO: Add token refresh / rotation for long-lived sessions.
 * TODO: Add token blacklisting for logout invalidation.
 */

import crypto from 'crypto';

/** Generate a secret at startup if none is provided via env */
const JWT_SECRET = process.env.SOCC_JWT_SECRET || crypto.randomBytes(32).toString('hex');

/** Token expiry: 24 hours */
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export interface TokenPayload {
  username: string;
  role: 'admin' | 'viewer';
  loginAt: number;
  exp: number;
}

function base64url(input: string): string {
  return Buffer.from(input).toString('base64url');
}

function fromBase64url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf-8');
}

/**
 * Create a signed token for a user session.
 */
export function createToken(username: string, role: 'admin' | 'viewer'): string {
  const now = Date.now();
  const payload: TokenPayload = {
    username,
    role,
    loginAt: now,
    exp: now + TOKEN_EXPIRY_MS,
  };

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verify a token and return its payload, or null if invalid/expired.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expected = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expected) return null;

    const payload = JSON.parse(fromBase64url(body)) as TokenPayload;

    // Check expiry
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}
