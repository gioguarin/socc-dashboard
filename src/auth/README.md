# Auth Architecture

## Overview

The SOCC Dashboard auth system is designed as a pluggable, opt-in architecture.
Auth is **disabled by default** — the dashboard works without any login wall.

When `SOCC_AUTH_ENABLED=true` is set:
- All `/api/*` routes (except `/api/auth/*`) require authentication
- The React app shows a login page before granting dashboard access
- Sessions are maintained via httpOnly cookies (HMAC-SHA256 signed tokens)

## Components

### Server Side
```
server/
  auth/
    token.ts      — JWT-like token creation/verification (built-in crypto)
    middleware.ts  — Express middleware that guards API routes
  routes/
    auth.ts       — Login, logout, and status endpoints
```

### Client Side
```
src/
  auth/
    types.ts           — All auth types, interfaces, preference types
    AuthContext.tsx     — React context + AuthProvider + useAuth() hook
    ProtectedRoute.tsx — Wrapper that gates access when auth is enabled
    index.ts           — Barrel exports
    adapters/
      apiAdapter.ts    — Default adapter (calls /api/auth/* endpoints)
    README.md          — This file
```

## Adapter Pattern

The auth system uses an **adapter pattern** so the backend can be swapped:

```typescript
interface AuthAdapter {
  getStatus(): Promise<AuthStatus>;
  login(credentials: LoginCredentials): Promise<LoginResult>;
  logout(): Promise<void>;
}
```

**Current:** `ApiAuthAdapter` — validates against env-var credentials via Express.

**To add OAuth/SSO:**
1. Create a new class implementing `AuthAdapter`
2. Add server-side routes for OAuth flow (authorize URL, callback)
3. Pass adapter to `<AuthProvider adapter={new OAuthAdapter()}>`

## API Endpoints

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| GET | `/api/auth/status` | No | Returns `{ authEnabled, user }` |
| POST | `/api/auth/login` | No | Login with `{ username, password }` |
| POST | `/api/auth/logout` | No | Clear session cookie |

## Security Notes

- Passwords are compared using `crypto.timingSafeEqual` (timing-attack resistant)
- Failed logins have a random 500-1000ms delay (brute-force deterrent)
- Tokens expire after 24 hours
- Cookies are httpOnly + secure (in production) + SameSite=Lax
- No credentials are ever stored in code — env vars only
- JWT secret is auto-generated at startup if not configured (set `SOCC_JWT_SECRET` for persistence)

## Future TODOs

- [ ] OAuth2 adapter (Google, GitHub)
- [ ] SSO/OIDC adapter (enterprise)
- [ ] Token refresh/rotation
- [ ] Rate limiting on login endpoint
- [ ] IP-based lockout after failed attempts
- [ ] Multi-user support with different roles
- [ ] User registration endpoint
- [ ] Audit logging for auth events
