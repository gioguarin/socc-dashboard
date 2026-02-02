/**
 * Theme selector — allows switching between dark, light, and CRT themes.
 * Shown in the header as a compact toggle button.
 */

import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeContext } from '../../contexts/ThemeContext';
import type { Theme } from '../../hooks/useTheme';

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Moon }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'crt', label: 'CRT', icon: Monitor },
];

export function ThemeSelector() {
  const { theme, setTheme } = useThemeContext();

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-socc-bg/60 border border-socc-border/30">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            p-1.5 rounded-md transition-all duration-150 relative
            ${theme === value
              ? 'bg-socc-cyan/10 text-socc-cyan'
              : 'text-gray-500 hover:text-gray-300'
            }
          `}
          title={`${label} theme`}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}
