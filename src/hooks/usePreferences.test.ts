import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePreferences } from './usePreferences';
import { DEFAULT_PREFERENCES } from '../auth/types';
import type { DashboardPanel } from '../auth/types';

describe('usePreferences hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('returns default preferences when nothing is stored', () => {
      const { result } = renderHook(() => usePreferences(null));
      expect(result.current.preferences).toEqual(DEFAULT_PREFERENCES);
    });

    it('loads stored preferences from localStorage', () => {
      const stored = {
        ...DEFAULT_PREFERENCES,
        autoRefreshMinutes: 15 as const,
        sidebarCollapsed: true,
      };
      localStorage.setItem('socc-prefs-anonymous', JSON.stringify(stored));

      const { result } = renderHook(() => usePreferences(null));
      expect(result.current.preferences.autoRefreshMinutes).toBe(15);
      expect(result.current.preferences.sidebarCollapsed).toBe(true);
    });

    it('uses username-scoped storage key when username provided', () => {
      const stored = {
        ...DEFAULT_PREFERENCES,
        defaultView: 'threats',
      };
      localStorage.setItem('socc-prefs-admin', JSON.stringify(stored));

      const { result } = renderHook(() => usePreferences('admin'));
      expect(result.current.preferences.defaultView).toBe('threats');
    });

    it('does not leak preferences between different users', () => {
      const adminPrefs = { ...DEFAULT_PREFERENCES, defaultView: 'threats' };
      const viewerPrefs = { ...DEFAULT_PREFERENCES, defaultView: 'news' };

      localStorage.setItem('socc-prefs-admin', JSON.stringify(adminPrefs));
      localStorage.setItem('socc-prefs-viewer', JSON.stringify(viewerPrefs));

      const { result: adminResult } = renderHook(() => usePreferences('admin'));
      const { result: viewerResult } = renderHook(() => usePreferences('viewer'));

      expect(adminResult.current.preferences.defaultView).toBe('threats');
      expect(viewerResult.current.preferences.defaultView).toBe('news');
    });

    it('falls back to defaults when localStorage has invalid JSON', () => {
      localStorage.setItem('socc-prefs-anonymous', 'bad-json{{{');
      const { result } = renderHook(() => usePreferences(null));
      expect(result.current.preferences).toEqual(DEFAULT_PREFERENCES);
    });

    it('merges stored preferences with defaults (handles new fields)', () => {
      // Only store a partial preferences object (simulating old version)
      const partial = { autoRefreshMinutes: 30 };
      localStorage.setItem('socc-prefs-anonymous', JSON.stringify(partial));

      const { result } = renderHook(() => usePreferences(null));
      // Should have the stored value merged with defaults
      expect(result.current.preferences.autoRefreshMinutes).toBe(30);
      // And default values for fields not in storage
      expect(result.current.preferences.sidebarCollapsed).toBe(DEFAULT_PREFERENCES.sidebarCollapsed);
      expect(result.current.preferences.visiblePanels).toEqual(DEFAULT_PREFERENCES.visiblePanels);
    });
  });

  describe('updatePreferences', () => {
    it('updates a single preference field', () => {
      const { result } = renderHook(() => usePreferences(null));

      act(() => {
        result.current.updatePreferences({ autoRefreshMinutes: 10 });
      });

      expect(result.current.preferences.autoRefreshMinutes).toBe(10);
    });

    it('persists updated preferences to localStorage', () => {
      const { result } = renderHook(() => usePreferences(null));

      act(() => {
        result.current.updatePreferences({ sidebarCollapsed: true });
      });

      const stored = JSON.parse(localStorage.getItem('socc-prefs-anonymous')!);
      expect(stored.sidebarCollapsed).toBe(true);
    });

    it('merges partial updates without overwriting other fields', () => {
      const { result } = renderHook(() => usePreferences(null));

      act(() => {
        result.current.updatePreferences({ autoRefreshMinutes: 30 });
      });

      act(() => {
        result.current.updatePreferences({ sidebarCollapsed: true });
      });

      // Both updates should be present
      expect(result.current.preferences.autoRefreshMinutes).toBe(30);
      expect(result.current.preferences.sidebarCollapsed).toBe(true);
    });

    it('updates defaultView preference', () => {
      const { result } = renderHook(() => usePreferences(null));

      act(() => {
        result.current.updatePreferences({ defaultView: 'threats' });
      });

      expect(result.current.preferences.defaultView).toBe('threats');
    });
  });

  describe('togglePanel', () => {
    it('removes a panel that is currently visible', () => {
      const { result } = renderHook(() => usePreferences(null));

      // threats is in DEFAULT_PREFERENCES.visiblePanels
      act(() => {
        result.current.togglePanel('threats');
      });

      expect(result.current.preferences.visiblePanels).not.toContain('threats');
    });

    it('adds a panel that is currently hidden', () => {
      // Start with no panels
      const noPanel = { ...DEFAULT_PREFERENCES, visiblePanels: [] as DashboardPanel[] };
      localStorage.setItem('socc-prefs-anonymous', JSON.stringify(noPanel));

      const { result } = renderHook(() => usePreferences(null));

      act(() => {
        result.current.togglePanel('threats');
      });

      expect(result.current.preferences.visiblePanels).toContain('threats');
    });

    it('persists panel toggle to localStorage', () => {
      const { result } = renderHook(() => usePreferences(null));

      act(() => {
        result.current.togglePanel('news');
      });

      const stored = JSON.parse(localStorage.getItem('socc-prefs-anonymous')!);
      expect(stored.visiblePanels).not.toContain('news');
    });

    it('toggles panel on then off', () => {
      // Start with no panels
      const noPanel = { ...DEFAULT_PREFERENCES, visiblePanels: [] as DashboardPanel[] };
      localStorage.setItem('socc-prefs-anonymous', JSON.stringify(noPanel));

      const { result } = renderHook(() => usePreferences(null));

      // Add panel
      act(() => {
        result.current.togglePanel('stocks');
      });
      expect(result.current.preferences.visiblePanels).toContain('stocks');

      // Remove panel
      act(() => {
        result.current.togglePanel('stocks');
      });
      expect(result.current.preferences.visiblePanels).not.toContain('stocks');
    });
  });

  describe('resetPreferences', () => {
    it('resets all preferences to defaults', () => {
      const { result } = renderHook(() => usePreferences(null));

      // Modify preferences
      act(() => {
        result.current.updatePreferences({
          autoRefreshMinutes: 30,
          sidebarCollapsed: true,
          defaultView: 'threats',
        });
      });

      // Reset
      act(() => {
        result.current.resetPreferences();
      });

      expect(result.current.preferences).toEqual(DEFAULT_PREFERENCES);
    });

    it('persists reset preferences to localStorage', () => {
      const { result } = renderHook(() => usePreferences(null));

      act(() => {
        result.current.updatePreferences({ autoRefreshMinutes: 30 });
      });

      act(() => {
        result.current.resetPreferences();
      });

      const stored = JSON.parse(localStorage.getItem('socc-prefs-anonymous')!);
      expect(stored.autoRefreshMinutes).toBe(DEFAULT_PREFERENCES.autoRefreshMinutes);
    });
  });

  describe('storage key scoping', () => {
    it('uses anonymous key for null username', () => {
      const { result } = renderHook(() => usePreferences(null));

      act(() => {
        result.current.updatePreferences({ sidebarCollapsed: true });
      });

      expect(localStorage.getItem('socc-prefs-anonymous')).not.toBeNull();
    });

    it('uses username-based key for authenticated users', () => {
      const { result } = renderHook(() => usePreferences('alice'));

      act(() => {
        result.current.updatePreferences({ sidebarCollapsed: true });
      });

      expect(localStorage.getItem('socc-prefs-alice')).not.toBeNull();
      expect(localStorage.getItem('socc-prefs-anonymous')).toBeNull();
    });
  });
});
