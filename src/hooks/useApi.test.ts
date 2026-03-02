import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { useApi } from './useApi';

// Helper to create a JSON mock response with proper headers
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (k: string) => (k === 'content-type' ? 'application/json' : null) },
  json: async () => body,
});

// A safe fallback response for any unexpected fetch calls
const fallbackResponse = () => jsonResponse({ _fallback: true });

// Each test uses a unique URL to avoid module-level cache collisions
let urlCounter = 0;
const nextUrl = () => `/api/test-${Date.now()}-${++urlCounter}`;

describe('useApi hook', () => {
  beforeEach(() => {
    // Default implementation prevents "Cannot read properties of undefined"
    // if a stale effect from a prior test triggers an extra fetch call
    global.fetch = vi.fn().mockImplementation(async () => fallbackResponse());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('fetches data successfully', async () => {
    const mockData = { message: 'success' };
    (global.fetch as any).mockResolvedValue(jsonResponse(mockData));

    const url = nextUrl();
    const { result } = renderHook(() => useApi(url));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(result.current.lastFetched).toBeInstanceOf(Date);
  });

  it('handles fetch errors (HTTP 404)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
    });

    const { result } = renderHook(() => useApi(nextUrl()));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('HTTP 404');
    expect(result.current.data).toBe(null);
  });

  it('handles network errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useApi(nextUrl()));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBe(null);
  });

  it('unwraps standardized API responses ({ success, data, anomaly })', async () => {
    const wrappedData = {
      success: true,
      data: { items: [1, 2, 3] },
      anomaly: { detected: true },
    };

    (global.fetch as any).mockResolvedValue(jsonResponse(wrappedData));

    const { result } = renderHook(() => useApi(nextUrl()));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // The hook unwraps: if json is an object with a `data` key, it returns json.data
    expect(result.current.data).toEqual({ items: [1, 2, 3] });
    expect(result.current.error).toBe(null);
  });

  it('returns plain data for non-wrapped array responses', async () => {
    const plainData = [1, 2, 3];

    (global.fetch as any).mockResolvedValue(jsonResponse(plainData));

    const { result } = renderHook(() => useApi(nextUrl()));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(plainData);
  });

  it('provides refetch function that re-requests data', async () => {
    const url = nextUrl();
    let callCount = 0;
    (global.fetch as any).mockImplementation(async () => {
      callCount++;
      return jsonResponse([callCount]);
    });

    const { result } = renderHook(() => useApi(url));

    await waitFor(() => {
      expect(result.current.data).toEqual([1]);
    });

    // Refetch
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.data).toEqual([2]);
    });
  });

  it('sets up refresh interval when provided', async () => {
    const url = nextUrl();
    let callCount = 0;
    (global.fetch as any).mockImplementation(async () => {
      callCount++;
      return jsonResponse([callCount]);
    });

    const { unmount } = renderHook(() => useApi(url, 50));

    await waitFor(
      () => {
        expect(callCount).toBeGreaterThanOrEqual(1);
      },
      { timeout: 1000 },
    );

    await new Promise((resolve) => setTimeout(resolve, 120));

    await waitFor(
      () => {
        expect(callCount).toBeGreaterThan(1);
      },
      { timeout: 1000 },
    );

    unmount();
  });

  it('clears interval on unmount', async () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

    (global.fetch as any).mockResolvedValue(jsonResponse({ data: 'test' }));

    const { unmount } = renderHook(() => useApi(nextUrl(), 50));

    await new Promise((resolve) => setTimeout(resolve, 100));

    const callsBefore = clearIntervalSpy.mock.calls.length;
    unmount();

    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('updates lastFetched on successful fetch', async () => {
    const beforeFetch = new Date();

    (global.fetch as any).mockResolvedValue(jsonResponse({ data: 'test' }));

    const { result } = renderHook(() => useApi(nextUrl()));

    await waitFor(
      () => {
        expect(result.current.lastFetched).not.toBe(null);
      },
      { timeout: 1000 },
    );

    const afterFetch = new Date();

    expect(result.current.lastFetched).toBeInstanceOf(Date);
    expect(result.current.lastFetched!.getTime()).toBeGreaterThanOrEqual(beforeFetch.getTime());
    expect(result.current.lastFetched!.getTime()).toBeLessThanOrEqual(afterFetch.getTime());
  });

  it('handles unknown (non-Error) rejection types', async () => {
    (global.fetch as any).mockRejectedValue('string error');

    const { result } = renderHook(() => useApi(nextUrl()));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 1000 },
    );

    expect(result.current.error).toBe('Unknown error');
  });

  it('clears error state on successful refetch', async () => {
    const url = nextUrl();

    // All calls fail initially
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useApi(url));

    await waitFor(
      () => {
        expect(result.current.error).toBe('Network error');
      },
      { timeout: 1000 },
    );

    // Switch to success — hook unwraps { data: 'success' } to 'success'
    (global.fetch as any).mockResolvedValue(jsonResponse({ data: 'success' }));

    result.current.refetch();

    await waitFor(
      () => {
        expect(result.current.error).toBe(null);
      },
      { timeout: 1000 },
    );

    expect(result.current.data).toBe('success');
  });

  it('throws error for non-JSON content-type response', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'text/html' },
    });

    const { result } = renderHook(() => useApi(nextUrl()));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 1000 },
    );

    expect(result.current.error).toBe('Non-JSON response');
    expect(result.current.data).toBe(null);
  });

  it('serves cached data synchronously on remount', async () => {
    const url = nextUrl();
    (global.fetch as any).mockResolvedValue(jsonResponse({ cached: true }));

    const { result: r1, unmount } = renderHook(() => useApi(url));
    await waitFor(() => {
      expect(r1.current.data).toEqual({ cached: true });
    });
    unmount();

    const { result: r2 } = renderHook(() => useApi(url));
    expect(r2.current.loading).toBe(false);
    expect(r2.current.data).toEqual({ cached: true });
  });
});
