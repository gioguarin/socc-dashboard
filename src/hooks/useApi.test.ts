import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from './useApi';

describe('useApi hook', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches data successfully', async () => {
    const mockData = { message: 'success' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useApi('/api/test'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(result.current.lastFetched).toBeInstanceOf(Date);
  });

  it('handles fetch errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useApi('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('HTTP 404');
    expect(result.current.data).toBe(null);
  });

  it('handles network errors', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useApi('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBe(null);
  });

  it('unwraps anomaly-wrapped responses', async () => {
    const wrappedData = {
      data: { items: [1, 2, 3] },
      anomaly: { detected: true },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => wrappedData,
    });

    const { result } = renderHook(() => useApi('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should unwrap and return only the data part
    expect(result.current.data).toEqual({ items: [1, 2, 3] });
  });

  it('returns plain data for non-wrapped responses', async () => {
    const plainData = [1, 2, 3];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => plainData,
    });

    const { result } = renderHook(() => useApi('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(plainData);
  });

  it('provides refetch function', async () => {
    let callCount = 0;
    (global.fetch as any).mockImplementation(async () => {
      callCount++;
      return {
        ok: true,
        json: async () => ({ count: callCount }),
      };
    });

    const { result } = renderHook(() => useApi('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ count: 1 });

    // Refetch
    result.current.refetch();

    await waitFor(() => {
      expect(result.current.data).toEqual({ count: 2 });
    });
  });

  it('sets up refresh interval when provided', async () => {
    let callCount = 0;
    (global.fetch as any).mockImplementation(async () => {
      callCount++;
      return {
        ok: true,
        json: async () => ({ count: callCount }),
      };
    });

    const { result, unmount } = renderHook(() => useApi('/api/test', 50));

    // Initial fetch
    await waitFor(() => {
      expect(result.current.data).toEqual({ count: 1 });
    }, { timeout: 1000 });

    // Wait for interval to trigger (50ms + buffer)
    await new Promise(resolve => setTimeout(resolve, 100));

    await waitFor(() => {
      expect(callCount).toBeGreaterThan(1);
    }, { timeout: 1000 });

    unmount();
  });

  it('clears interval on unmount', async () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    const { unmount } = renderHook(() => useApi('/api/test', 50));

    // Wait for initial fetch
    await new Promise(resolve => setTimeout(resolve, 100));

    const callsBefore = clearIntervalSpy.mock.calls.length;

    unmount();

    // Should have called clearInterval
    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('updates lastFetched on successful fetch', async () => {
    const beforeFetch = new Date();

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    const { result } = renderHook(() => useApi('/api/test'));

    await waitFor(() => {
      expect(result.current.lastFetched).not.toBe(null);
    }, { timeout: 1000 });

    const afterFetch = new Date();

    expect(result.current.lastFetched).toBeInstanceOf(Date);
    expect(result.current.lastFetched!.getTime()).toBeGreaterThanOrEqual(beforeFetch.getTime());
    expect(result.current.lastFetched!.getTime()).toBeLessThanOrEqual(afterFetch.getTime());
  });

  it('handles unknown error types', async () => {
    (global.fetch as any).mockRejectedValueOnce('string error');

    const { result } = renderHook(() => useApi('/api/test'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 1000 });

    expect(result.current.error).toBe('Unknown error');
  });

  it('clears error on successful refetch', async () => {
    // First call fails
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useApi('/api/test'));

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    }, { timeout: 1000 });

    // Second call succeeds
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'success' }),
    });

    result.current.refetch();

    await waitFor(() => {
      expect(result.current.error).toBe(null);
    }, { timeout: 1000 });

    expect(result.current.data).toEqual({ data: 'success' });
  });
});
