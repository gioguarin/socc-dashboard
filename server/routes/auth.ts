/**
 * Auth API routes.
 *
 * Provides login, logout, and session status endpoints.
 * Currently uses environment-variable credentials (SOCC_ADMIN_USER / SOCC_ADMIN_PASS).
 *
 * Rate Limiting:
 * - Login attempts: 5 per 15 minutes per IP
 * - Refresh attempts: 10 per 15 minutes per IP
 * - General auth endpoints: 20 per minute per IP
 *
 * TODO: Replace env-var auth with a proper auth provider (OAuth, SSO, LDAP).
 * TODO: Add /api/auth/register for multi-user support.
 * TODO: Add /api/auth/providers for listing available OAuth providers.
 */

import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { createToken, createRefreshToken, verifyToken } from '../auth/token.js';
import { sendSuccess, sendError, sendBadRequest, sendUnauthorized } from '../utils/response.js';

const router = Router();

/** Rate limiter for login attempts - strict to prevent brute force */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting when auth is disabled
  skip: () => process.env.SOCC_AUTH_ENABLED !== 'true',
});

/** Rate limiter for refresh token requests */
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 refresh attempts per window
  message: { error: 'Too many refresh requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.SOCC_AUTH_ENABLED !== 'true',
});

/** General rate limiter for auth endpoints */
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Cookie options for the session token */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
};

/** Cookie options for refresh token (7 days) */
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',
};

/**
 * @swagger
 * /api/auth/status:
 *   get:
 *     summary: Check authentication status
 *     description: Returns whether authentication is enabled and current user info if authenticated
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Authentication status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authEnabled:
 *                   type: boolean
 *                   description: Whether authentication is enabled
 *                 user:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, viewer]
 *                     loginAt:
 *                       type: number
 *                       description: Unix timestamp of login
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/status', authLimiter, async (req: Request, res: Response) => {
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
      const payload = await verifyToken(token);
      if (payload) {
        user = {
          username: payload.username,
          role: payload.role,
          loginAt: payload.loginAt,
        };
      }
    }
  }

  sendSuccess(res, { authEnabled, user });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user
 *     description: Login with username and password. Returns session tokens in httpOnly cookies.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: Session token and refresh token cookies
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, viewer]
 *                     loginAt:
 *                       type: number
 *       400:
 *         description: Bad request (missing credentials or auth disabled)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server authentication not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const authEnabled = process.env.SOCC_AUTH_ENABLED === 'true';
  if (!authEnabled) {
    sendBadRequest(res, 'Authentication is not enabled');
    return;
  }

  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    sendBadRequest(res, 'Username and password are required');
    return;
  }

  const adminUser = process.env.SOCC_ADMIN_USER;
  const adminPass = process.env.SOCC_ADMIN_PASS;

  if (!adminUser || !adminPass) {
    console.error('❌ SOCC_ADMIN_USER and SOCC_ADMIN_PASS must be set when auth is enabled');
    sendError(res, 'Server authentication not configured', { status: 500 });
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
      sendUnauthorized(res, 'Invalid credentials');
    }, 500 + Math.random() * 500);
    return;
  }

  // Create session tokens — admin role for env-var user
  const token = await createToken(username, 'admin');
  const refreshToken = await createRefreshToken(username, 'admin');

  // Set httpOnly cookies
  res.cookie('socc_token', token, COOKIE_OPTIONS);
  res.cookie('socc_refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

  sendSuccess(res, {
    user: {
      username,
      role: 'admin' as const,
      loginAt: Math.floor(Date.now() / 1000),
    },
  });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Clear session tokens and logout
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', authLimiter, (_req: Request, res: Response) => {
  res.clearCookie('socc_token', { path: '/' });
  res.clearCookie('socc_refresh_token', { path: '/api/auth' });
  sendSuccess(res, { message: 'Logged out successfully' });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             description: New access token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [admin, viewer]
 *                     loginAt:
 *                       type: number
 *       400:
 *         description: Authentication not enabled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No refresh token or token invalid/expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many refresh requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', refreshLimiter, async (req: Request, res: Response) => {
  const authEnabled = process.env.SOCC_AUTH_ENABLED === 'true';
  if (!authEnabled) {
    sendBadRequest(res, 'Authentication is not enabled');
    return;
  }

  // Extract refresh token from cookie
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    sendUnauthorized(res, 'No refresh token found');
    return;
  }

  const cookies = cookieHeader.split(';').reduce<Record<string, string>>((acc, c) => {
    const eqIdx = c.indexOf('=');
    if (eqIdx !== -1) {
      acc[c.substring(0, eqIdx).trim()] = c.substring(eqIdx + 1).trim();
    }
    return acc;
  }, {});

  const refreshToken = cookies['socc_refresh_token'];
  if (!refreshToken) {
    sendUnauthorized(res, 'No refresh token found');
    return;
  }

  // Verify refresh token
  const { verifyRefreshToken } = await import('../auth/token.js');
  const payload = await verifyRefreshToken(refreshToken);

  if (!payload) {
    sendUnauthorized(res, 'Invalid or expired refresh token');
    return;
  }

  // Create new access token
  const newToken = await createToken(payload.username, payload.role);

  // Set new access token cookie
  res.cookie('socc_token', newToken, COOKIE_OPTIONS);

  sendSuccess(res, {
    user: {
      username: payload.username,
      role: payload.role,
      loginAt: Math.floor(Date.now() / 1000),
    },
  });
});

export default router;
