import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';
import type { Theme } from './useTheme';

describe('useTheme hook', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset document classes
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  describe('initial state', () => {
    it('defaults to dark theme when no preference stored', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('dark');
    });

    it('loads stored theme from localStorage', () => {
      localStorage.setItem('socc-theme', 'light');
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('light');
    });

    it('loads crt theme from localStorage', () => {
      localStorage.setItem('socc-theme', 'crt');
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('crt');
    });

    it('falls back to dark for invalid stored theme', () => {
      localStorage.setItem('socc-theme', 'invalid-theme');
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('dark');
    });
  });

  describe('setTheme', () => {
    it('changes the theme to light', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });

    it('changes the theme to crt', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('crt');
      });

      expect(result.current.theme).toBe('crt');
    });

    it('persists theme to localStorage', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(localStorage.getItem('socc-theme')).toBe('light');
    });

    it('applies theme class to document root', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    });

    it('applies dark class for dark theme', () => {
      const { result } = renderHook(() => useTheme());

      // Start with light, then switch to dark
      act(() => {
        result.current.setTheme('light');
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('applies dark class for crt theme', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('crt');
      });

      expect(document.documentElement.classList.contains('theme-crt')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class for light theme', () => {
      const { result } = renderHook(() => useTheme());

      // First set to dark to add the class
      act(() => {
        result.current.setTheme('dark');
      });

      // Now switch to light
      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('sets data-theme attribute on document root', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('crt');
      });

      expect(document.documentElement.getAttribute('data-theme')).toBe('crt');
    });
  });

  describe('cycleTheme', () => {
    it('cycles from dark to light', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.cycleTheme();
      });

      expect(result.current.theme).toBe('light');
    });

    it('cycles from light to crt', () => {
      localStorage.setItem('socc-theme', 'light');
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.cycleTheme();
      });

      expect(result.current.theme).toBe('crt');
    });

    it('cycles from crt back to dark', () => {
      localStorage.setItem('socc-theme', 'crt');
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.cycleTheme();
      });

      expect(result.current.theme).toBe('dark');
    });

    it('completes a full cycle', () => {
      const { result } = renderHook(() => useTheme());

      const themes: Theme[] = [];
      themes.push(result.current.theme);

      act(() => { result.current.cycleTheme(); });
      themes.push(result.current.theme);

      act(() => { result.current.cycleTheme(); });
      themes.push(result.current.theme);

      act(() => { result.current.cycleTheme(); });
      themes.push(result.current.theme);

      // Should be back to the start
      expect(themes[0]).toBe(themes[3]);
      expect(themes).toEqual(['dark', 'light', 'crt', 'dark']);
    });
  });

  describe('localStorage resilience', () => {
    it('does not throw when localStorage is unavailable on set', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new DOMException('SecurityError');
      };

      const { result } = renderHook(() => useTheme());

      expect(() => {
        act(() => {
          result.current.setTheme('light');
        });
      }).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });
  });
});
