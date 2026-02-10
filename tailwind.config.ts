import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        socc: {
          bg: 'var(--socc-bg)',
          surface: 'var(--socc-surface)',
          card: 'var(--socc-card)',
          border: 'var(--socc-border)',
          hover: 'var(--socc-hover)',
          cyan: 'var(--socc-cyan)',
          'cyan-dim': '#0891b2',
          'cyan-bright': '#22d3ee',
          red: '#ef4444',
          amber: '#f59e0b',
          green: '#22c55e',
          purple: '#a855f7',
          blue: '#3b82f6',
          indigo: '#818cf8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'border-glow': 'borderGlow 3s ease-in-out infinite alternate',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.1)' },
          '100%': { boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        borderGlow: {
          '0%': { borderColor: 'rgba(6, 182, 212, 0.2)' },
          '100%': { borderColor: 'rgba(6, 182, 212, 0.5)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
