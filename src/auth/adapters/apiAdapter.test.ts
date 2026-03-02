import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiAuthAdapter } from './apiAdapter';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const jsonOk = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const jsonErr = (body: unknown, status: number) => ({
  ok: false,
  status,
  json: async () => body,
});

// ─── ApiAuthAdapter ───────────────────────────────────────────────────────────

describe('ApiAuthAdapter', () => {
  let adapter: ApiAuthAdapter;

  beforeEach(() => {
    adapter = new ApiAuthAdapter();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── getStatus ──────────────────────────────────────────────────────────────

  describe('getStatus()', () => {
    it('returns auth status from a successful response', async () => {
      const mockStatus = { authEnabled: true, user: { username: 'admin', role: 'admin' } };
      (global.fetch as any).mockResolvedValueOnce(jsonOk(mockStatus));

      const result = await adapter.getStatus();
      expect(result).toEqual(mockStatus);
    });

    it('calls /api/auth/status with credentials: include', async () => {
      (global.fetch as any).mockResolvedValueOnce(jsonOk({ authEnabled: false, user: null }));

      await adapter.getStatus();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/status'),
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    it('returns { authEnabled: false, user: null } when server responds with non-OK status', async () => {
      (global.fetch as any).mockResolvedValueOnce(jsonErr({}, 500));

      const result = await adapter.getStatus();
      expect(result).toEqual({ authEnabled: false, user: null });
    });

    it('returns { authEnabled: false, user: null } on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network down'));

      const result = await adapter.getStatus();
      expect(result).toEqual({ authEnabled: false, user: null });
    });

    it('does not throw on any failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));
      await expect(adapter.getStatus()).resolves.toBeDefined();
    });
  });

  // ─── login ──────────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('returns success with user on valid credentials', async () => {
      const user = { username: 'admin', role: 'admin' };
      (global.fetch as any).mockResolvedValueOnce(jsonOk({ user }));

      const result = await adapter.login({ username: 'admin', password: 'secret' });
      expect(result.success).toBe(true);
      expect(result.user).toEqual(user);
    });

    it('sends credentials as JSON body via POST', async () => {
      (global.fetch as any).mockResolvedValueOnce(jsonOk({ user: null }));

      await adapter.login({ username: 'admin', password: 'secret' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify({ username: 'admin', password: 'secret' }),
        }),
      );
    });

    it('returns failure with server error message on non-OK response', async () => {
      (global.fetch as any).mockResolvedValueOnce(jsonErr({ error: 'Invalid credentials' }, 401));

      const result = await adapter.login({ username: 'admin', password: 'wrong' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('uses fallback error message when server returns no error field', async () => {
      (global.fetch as any).mockResolvedValueOnce(jsonErr({}, 500));

      const result = await adapter.login({ username: 'admin', password: 'x' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });

    it('returns network error message on fetch rejection', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Connection refused'));

      const result = await adapter.login({ username: 'admin', password: 'x' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('does not throw on any failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));
      await expect(adapter.login({ username: '', password: '' })).resolves.toBeDefined();
    });
  });

  // ─── logout ─────────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('sends a POST to /api/auth/logout with credentials: include', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      await adapter.logout();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
    });

    it('resolves without throwing when the server responds with an error', async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(adapter.logout()).resolves.toBeUndefined();
    });

    it('resolves without throwing on network error (best-effort logout)', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network down'));
      await expect(adapter.logout()).resolves.toBeUndefined();
    });
  });
});
