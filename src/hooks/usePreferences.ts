/**
 * User preferences hook.
 * Stores preferences in localStorage, keyed by username when auth is active.
 * Falls back to 'anonymous' key when auth is disabled.
 */

import { useState, useCallback, useMemo } from 'react';
import type { UserPreferences, DashboardPanel } from '../auth/types';
import { DEFAULT_PREFERENCES } from '../auth/types';

const PREFS_PREFIX = 'socc-prefs';

function getStorageKey(username: string | null): string {
  return `${PREFS_PREFIX}-${username || 'anonymous'}`;
}

function loadPreferences(key: string): UserPreferences {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    // Merge with defaults to handle added fields in future versions
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function savePreferences(key: string, prefs: UserPreferences): void {
  try {
    localStorage.setItem(key, JSON.stringify(prefs));
  } catch {
    // localStorage quota exceeded — silently fail
  }
}

interface UsePreferencesReturn {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  togglePanel: (panel: DashboardPanel) => void;
  resetPreferences: () => void;
}

export function usePreferences(username: string | null): UsePreferencesReturn {
  const storageKey = useMemo(() => getStorageKey(username), [username]);
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences(storageKey));

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updates };
      savePreferences(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const togglePanel = useCallback((panel: DashboardPanel) => {
    setPreferences((prev) => {
      const panels = prev.visiblePanels.includes(panel)
        ? prev.visiblePanels.filter((p) => p !== panel)
        : [...prev.visiblePanels, panel];
      const next = { ...prev, visiblePanels: panels };
      savePreferences(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const resetPreferences = useCallback(() => {
    const defaults = { ...DEFAULT_PREFERENCES };
    savePreferences(storageKey, defaults);
    setPreferences(defaults);
  }, [storageKey]);

  return { preferences, updatePreferences, togglePanel, resetPreferences };
}
