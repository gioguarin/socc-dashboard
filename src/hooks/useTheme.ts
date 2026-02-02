/**
 * Theme hook — manages dark/light/CRT theme selection.
 * Persists to localStorage, applies CSS class to <html>.
 */

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light' | 'crt';

const THEME_STORAGE_KEY = 'socc-theme';
const VALID_THEMES: Theme[] = ['dark', 'light', 'crt'];

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && VALID_THEMES.includes(stored as Theme)) {
      return stored as Theme;
    }
  } catch {
    // localStorage unavailable
  }
  return 'dark';
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  // Remove all theme classes
  root.classList.remove('theme-dark', 'theme-light', 'theme-crt', 'dark');

  // Apply the selected theme class
  root.classList.add(`theme-${theme}`);

  // Tailwind's dark mode class (used for base contrast)
  if (theme === 'dark' || theme === 'crt') {
    root.classList.add('dark');
  }

  // Set a data attribute for CSS selectors
  root.setAttribute('data-theme', theme);
}

interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  // Apply theme on mount and changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme(VALID_THEMES[(VALID_THEMES.indexOf(theme) + 1) % VALID_THEMES.length]);
  }, [theme, setTheme]);

  return { theme, setTheme, cycleTheme };
}
