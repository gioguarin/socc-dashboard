/**
 * JWT token utilities using jose library (industry-standard, battle-tested).
 * Provides token generation, verification, and refresh capabilities.
 *
 * Architecture Note:
 * - Uses jose library for secure JWT handling
 * - Supports token refresh via separate refresh tokens
 * - HMAC-SHA256 signing (HS256 algorithm)
 * - Environment-based secret management
 */

import crypto from 'crypto';
import * as jose from 'jose';

/** Generate a secret at startup if none is provided via env */
const JWT_SECRET = process.env.SOCC_JWT_SECRET || crypto.randomBytes(32).toString('hex');

/** Convert secret string to Uint8Array for jose */
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

/** Token expiry: 24 hours for access tokens */
const ACCESS_TOKEN_EXPIRY = '24h';

/** Refresh token expiry: 7 days */
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  username: string;
  role: 'admin' | 'viewer';
  loginAt: number;
  exp: number;
}

/**
 * Create a signed access token for a user session.
 */
export async function createToken(username: string, role: 'admin' | 'viewer'): Promise<string> {
  const now = Math.floor(Date.now() / 1000); // JWT uses seconds since epoch

  const token = await new jose.SignJWT({
    username,
    role,
    loginAt: now,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(SECRET_KEY);

  return token;
}

/**
 * Create a refresh token for token rotation.
 */
export async function createRefreshToken(username: string, role: 'admin' | 'viewer'): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const token = await new jose.SignJWT({
    username,
    role,
    type: 'refresh',
    loginAt: now,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(SECRET_KEY);

  return token;
}

/**
 * Verify a token and return its payload, or null if invalid/expired.
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });

    // Convert JWT payload to our TokenPayload format
    return {
      username: payload.username as string,
      role: payload.role as 'admin' | 'viewer',
      loginAt: payload.loginAt as number,
      exp: payload.exp as number,
    };
  } catch (err) {
    // Token verification failed (expired, invalid signature, malformed, etc.)
    return null;
  }
}

/**
 * Verify a refresh token and return its payload, or null if invalid.
 */
export async function verifyRefreshToken(token: string): Promise<{ username: string; role: 'admin' | 'viewer' } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });

    // Ensure it's a refresh token
    if (payload.type !== 'refresh') return null;

    return {
      username: payload.username as string,
      role: payload.role as 'admin' | 'viewer',
    };
  } catch {
    return null;
  }
}

/**
 * Decode token without verification (for inspection only, DO NOT trust).
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jose.decodeJwt(token);
    return {
      username: decoded.username as string,
      role: decoded.role as 'admin' | 'viewer',
      loginAt: decoded.loginAt as number,
      exp: decoded.exp as number,
    };
  } catch {
    return null;
  }
}
