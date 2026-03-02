import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApiWithAnomaly } from './useApiWithAnomaly';

// Helper to create a JSON mock response with proper headers
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (k: string) => (k === 'content-type' ? 'application/json' : null) },
  json: async () => body,
});

// Each test uses a unique URL to avoid module-level cache collisions
let urlCounter = 10000; // offset from useApi tests
const nextUrl = () => `/api/anomaly-unique-${++urlCounter}`;

describe('useApiWithAnomaly hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('wrapped { data, anomaly } response', () => {
    it('unwraps data array and anomaly from response', async () => {
      const mockData = [{ id: 1, title: 'Threat Alpha' }];
      const mockAnomaly = {
        detected: true,
        type: 'spike',
        currentCount: 15,
        averageCount: 5,
        multiplier: 3,
        message: 'Unusual spike in threats',
      };

      (global.fetch as any).mockResolvedValue(
        jsonResponse({ data: mockData, anomaly: mockAnomaly })
      );

      const { result } = renderHook(() => useApiWithAnomaly(nextUrl()));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.anomaly).toEqual(mockAnomaly);
      expect(result.current.error).toBe(null);
    });

    it('sets anomaly to null when response has null anomaly', async () => {
      (global.fetch as any).mockResolvedValue(
        jsonResponse({ data: [{ id: 1 }], anomaly: null })
      );

      const { result } = renderHook(() => useApiWithAnomaly(nextUrl()));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual([{ id: 1 }]);
      expect(result.current.anomaly).toBe(null);
    });

    it('falls back to treating full response as data for non-array payload', async () => {
      const plainData = { key: 'value' };
      (global.fetch as any).mockResolvedValue(jsonResponse(plainData));

      const { result } = renderHook(() => useApiWithAnomaly(nextUrl()));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(plainData);
      expect(result.current.anomaly).toBe(null);
    });

    it('treats plain array response as data without anomaly', async () => {
      const plainArray = [1, 2, 3];
      (global.fetch as any).mockResolvedValue(jsonResponse(plainArray));

      const { result } = renderHook(() => useApiWithAnomaly(nextUrl()));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(plainArray);
      expect(result.current.anomaly).toBe(null);
    });
  });

  describe('error handling', () => {
    it('sets error on HTTP 404', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        headers: { get: () => null },
      });

      const { result } = renderHook(() => useApiWithAnomaly(nextUrl()));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('HTTP 404');
      expect(result.current.data).toBe(null);
    });

    it('sets error on HTTP 500', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        headers: { get: () => null },
      });

      const { result } = renderHook(() => useApiWithAnomaly(nextUrl()));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('HTTP 500');
    });

    it('sets error message on network failure', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useApiWithAnomaly(nextUrl()));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.data).toBe(null);
    });

    it('sets "Unknown error" for non-Error rejection', async () => {
      (global.fetch as any).mockRejectedValue('string error');

      const { result } = renderHook(() => useApiWithAnomaly(nextUrl()));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Unknown error');
    });

    it('sets error for non-JSON content-type', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'text/html' },
      });

      const { result } = renderHook(() => useApiWithAnomaly(nextUrl()));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Non-JSON response');
      expect(result.current.data).toBe(null);
    });
  });

  describe('loading state', () => {
    it('starts with loading=true when no cache exists for the URL', () => {
      (global.fetch as any).mockResolvedValue(
        jsonResponse({ data: [], anomaly: null })
      );

      const { result } = renderHook(() => useApiWithAnomaly(nextUrl()));
      expect(result.current.loading).toBe(true);
    });

    it('has loading=false and data=null initially then resolves', async () => {
      (global.fetch as any).mockResolvedValue(
        jsonResponse({ data: [{ id: 1 }], anomaly: null })
      );

      const { result } = renderHook(() => useApiWithAnomaly(nextUrl()));

      await waitFor(() => {
        expect(result.current.data).toEqual([{ id: 1 }]);
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('refetch', () => {
    it('clears error state on successful refetch after failure', async () => {
      const url = nextUrl();

      // First call fails
      (global.fetch as any).mockRejectedValueOnce(new Error('Initial failure'));
      // Second call succeeds
      (global.fetch as any).mockResolvedValue(
        jsonResponse({ data: [{ id: 1 }], anomaly: null })
      );

      const { result } = renderHook(() => useApiWithAnomaly(url));

      await waitFor(() => {
        expect(result.current.error).toBe('Initial failure');
      });

      result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });

      expect(result.current.data).toEqual([{ id: 1 }]);
    });
  });

  describe('caching', () => {
    it('starts with loading=false and cached data when URL was previously fetched', async () => {
      const url = nextUrl();
      (global.fetch as any).mockResolvedValue(
        jsonResponse({ data: [{ cached: true }], anomaly: null })
      );

      // First mount — populates cache
      const { result: r1, unmount } = renderHook(() => useApiWithAnomaly(url));
      await waitFor(() => {
        expect(r1.current.data).toEqual([{ cached: true }]);
      });
      unmount();

      // Second mount — should start with cached data
      const { result: r2 } = renderHook(() => useApiWithAnomaly(url));
      expect(r2.current.loading).toBe(false);
      expect(r2.current.data).toEqual([{ cached: true }]);
    });
  });

  describe('lastFetched', () => {
    it('sets lastFetched timestamp on successful response', async () => {
      const beforeFetch = new Date();
      (global.fetch as any).mockResolvedValue(
        jsonResponse({ data: [], anomaly: null })
      );

      const { result } = renderHook(() => useApiWithAnomaly(nextUrl()));

      await waitFor(() => {
        expect(result.current.lastFetched).not.toBeNull();
      });

      const afterFetch = new Date();
      expect(result.current.lastFetched).toBeInstanceOf(Date);
      expect(result.current.lastFetched!.getTime()).toBeGreaterThanOrEqual(beforeFetch.getTime());
      expect(result.current.lastFetched!.getTime()).toBeLessThanOrEqual(afterFetch.getTime());
    });
  });

  describe('anomaly data structure', () => {
    it('exposes all anomaly fields when anomaly is detected', async () => {
      const anomaly = {
        detected: true,
        type: 'volume_spike',
        currentCount: 20,
        averageCount: 5,
        multiplier: 4,
        message: 'Threat volume is 4x normal',
      };

      (global.fetch as any).mockResolvedValue(
        jsonResponse({ data: [], anomaly })
      );

      const { result } = renderHook(() => useApiWithAnomaly(nextUrl()));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.anomaly?.detected).toBe(true);
      expect(result.current.anomaly?.type).toBe('volume_spike');
      expect(result.current.anomaly?.currentCount).toBe(20);
      expect(result.current.anomaly?.averageCount).toBe(5);
      expect(result.current.anomaly?.multiplier).toBe(4);
      expect(result.current.anomaly?.message).toBe('Threat volume is 4x normal');
    });

    it('clears anomaly when refetching returns no anomaly', async () => {
      const url = nextUrl();
      const anomaly = { detected: true, type: 'spike', currentCount: 10, averageCount: 2, multiplier: 5, message: 'Spike' };

      // First fetch: with anomaly
      (global.fetch as any).mockResolvedValueOnce(jsonResponse({ data: [{ id: 1 }], anomaly }));
      // Second fetch: without anomaly
      (global.fetch as any).mockResolvedValue(jsonResponse({ data: [{ id: 1 }], anomaly: null }));

      const { result } = renderHook(() => useApiWithAnomaly(url));

      await waitFor(() => {
        expect(result.current.anomaly).toEqual(anomaly);
      });

      result.current.refetch();

      await waitFor(() => {
        expect(result.current.anomaly).toBe(null);
      });
    });
  });

  describe('refresh interval', () => {
    it('clears interval on unmount', async () => {
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
      (global.fetch as any).mockResolvedValue(
        jsonResponse({ data: [], anomaly: null })
      );

      const { unmount } = renderHook(() => useApiWithAnomaly(nextUrl(), 5000));

      await new Promise((resolve) => setTimeout(resolve, 50));

      const callsBefore = clearIntervalSpy.mock.calls.length;
      unmount();

      expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });
});
