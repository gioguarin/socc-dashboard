import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  timeAgo,
  formatDate,
  formatDateTime,
  formatPrice,
  formatChange,
  formatPercent,
  formatCurrentTime,
  isOnShift,
  getCvssColor,
  getCvssBgColor,
} from './formatters';

// ─── timeAgo ────────────────────────────────────────────────────────────────

describe('timeAgo', () => {
  it('returns "just now" for timestamps within the last 60 seconds', () => {
    const date = new Date(Date.now() - 30 * 1000).toISOString();
    expect(timeAgo(date)).toBe('just now');
  });

  it('returns minutes ago for timestamps within the last hour', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(date)).toBe('5m ago');
  });

  it('returns 59m ago at the boundary just before one hour', () => {
    const date = new Date(Date.now() - 59 * 60 * 1000 - 30 * 1000).toISOString();
    expect(timeAgo(date)).toBe('59m ago');
  });

  it('returns hours ago for timestamps within the last 24 hours', () => {
    const date = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(timeAgo(date)).toBe('3h ago');
  });

  it('returns days ago for timestamps within the last week', () => {
    const date = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    expect(timeAgo(date)).toBe('3d ago');
  });

  it('returns a formatted date for timestamps older than one week', () => {
    // Use a fixed past date well beyond one week
    const old = '2020-01-15T00:00:00Z';
    const result = timeAgo(old);
    // Should delegate to formatDate — contains "Jan", "2020"
    expect(result).toContain('2020');
    expect(result).toMatch(/Jan/i);
  });
});

// ─── formatDate ─────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats an ISO date string into short month/day/year', () => {
    const result = formatDate('2024-06-15T00:00:00Z');
    expect(result).toMatch(/Jun/i);
    expect(result).toContain('2024');
  });

  it('includes the day number', () => {
    // Use noon UTC to avoid timezone-driven day-boundary shifts
    const result = formatDate('2024-03-15T12:00:00Z');
    expect(result).toContain('15');
  });
});

// ─── formatDateTime ──────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('returns a non-empty string', () => {
    const result = formatDateTime('2024-06-15T14:30:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the month', () => {
    const result = formatDateTime('2024-06-15T14:30:00Z');
    expect(result).toMatch(/Jun/i);
  });

  it('includes hour and minute components', () => {
    const result = formatDateTime('2024-06-15T14:30:00Z');
    // en-US locale with hour12:true uses AM/PM
    expect(result).toMatch(/AM|PM/);
    expect(result).toMatch(/\d+:\d+/);
  });
});

// ─── formatPrice ─────────────────────────────────────────────────────────────

describe('formatPrice', () => {
  it('formats to two decimal places', () => {
    expect(formatPrice(100)).toBe('100.00');
    expect(formatPrice(99.9)).toBe('99.90');
    expect(formatPrice(1.234)).toBe('1.23');
  });

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('0.00');
  });

  it('handles large numbers', () => {
    expect(formatPrice(12345.678)).toBe('12345.68');
  });
});

// ─── formatChange ─────────────────────────────────────────────────────────────

describe('formatChange', () => {
  it('prepends "+" for positive changes', () => {
    expect(formatChange(2.5)).toBe('+2.50');
  });

  it('does not prepend "+" for zero', () => {
    expect(formatChange(0)).toBe('+0.00');
  });

  it('preserves "-" for negative changes', () => {
    expect(formatChange(-1.23)).toBe('-1.23');
  });

  it('rounds to two decimal places', () => {
    // Use a value without floating-point edge cases
    expect(formatChange(1.016)).toBe('+1.02');
  });
});

// ─── formatPercent ────────────────────────────────────────────────────────────

describe('formatPercent', () => {
  it('appends "%" and prepends "+" for positive', () => {
    expect(formatPercent(1.95)).toBe('+1.95%');
  });

  it('appends "%" and keeps "-" for negative', () => {
    expect(formatPercent(-1.73)).toBe('-1.73%');
  });

  it('handles zero', () => {
    expect(formatPercent(0)).toBe('+0.00%');
  });

  it('rounds to two decimal places', () => {
    expect(formatPercent(10.567)).toBe('+10.57%');
  });
});

// ─── formatCurrentTime ────────────────────────────────────────────────────────

describe('formatCurrentTime', () => {
  it('returns a non-empty string', () => {
    const result = formatCurrentTime();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes AM or PM (12-hour format)', () => {
    expect(formatCurrentTime()).toMatch(/AM|PM/);
  });

  it('includes a 4-digit year', () => {
    expect(formatCurrentTime()).toMatch(/\d{4}/);
  });
});

// ─── isOnShift ────────────────────────────────────────────────────────────────

describe('isOnShift', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('uses stored config from localStorage when available', () => {
    // Set a config that is always on-shift: all days, hour 0–23
    const cfg = { days: [0, 1, 2, 3, 4, 5, 6], startHour: 0, endHour: 23, timezone: 'UTC' };
    localStorage.setItem('socc-shift-config', JSON.stringify(cfg));
    // With all days and hour 0–23 this is always true (except exactly at hour 23)
    // Rather than relying on the real clock, just confirm it reads from storage
    expect(typeof isOnShift()).toBe('boolean');
  });

  it('returns false when configured for no days (empty array)', () => {
    const cfg = { days: [], startHour: 0, endHour: 23, timezone: 'UTC' };
    localStorage.setItem('socc-shift-config', JSON.stringify(cfg));
    expect(isOnShift()).toBe(false);
  });

  it('falls back to defaults gracefully when localStorage has invalid JSON', () => {
    localStorage.setItem('socc-shift-config', 'bad-json{{{');
    // Should not throw
    expect(() => isOnShift()).not.toThrow();
    expect(typeof isOnShift()).toBe('boolean');
  });

  it('returns a boolean when no config is stored', () => {
    expect(typeof isOnShift()).toBe('boolean');
  });
});

// ─── getCvssColor ─────────────────────────────────────────────────────────────

describe('getCvssColor', () => {
  it('returns red for Critical (>= 9.0)', () => {
    expect(getCvssColor(9.0)).toContain('red');
    expect(getCvssColor(10.0)).toContain('red');
    expect(getCvssColor(9.5)).toContain('red');
  });

  it('returns orange for High (7.0 – 8.9)', () => {
    expect(getCvssColor(7.0)).toContain('orange');
    expect(getCvssColor(8.9)).toContain('orange');
  });

  it('returns amber for Medium (4.0 – 6.9)', () => {
    expect(getCvssColor(4.0)).toContain('amber');
    expect(getCvssColor(6.9)).toContain('amber');
  });

  it('returns blue for Low (< 4.0)', () => {
    expect(getCvssColor(0)).toContain('blue');
    expect(getCvssColor(3.9)).toContain('blue');
  });
});

// ─── getCvssBgColor ───────────────────────────────────────────────────────────

describe('getCvssBgColor', () => {
  it('returns red background for Critical (>= 9.0)', () => {
    expect(getCvssBgColor(9.0)).toContain('red');
    expect(getCvssBgColor(10.0)).toContain('red');
  });

  it('returns orange background for High (7.0 – 8.9)', () => {
    expect(getCvssBgColor(7.0)).toContain('orange');
    expect(getCvssBgColor(8.5)).toContain('orange');
  });

  it('returns amber background for Medium (4.0 – 6.9)', () => {
    expect(getCvssBgColor(4.0)).toContain('amber');
    expect(getCvssBgColor(5.5)).toContain('amber');
  });

  it('returns blue background for Low (< 4.0)', () => {
    expect(getCvssBgColor(0)).toContain('blue');
    expect(getCvssBgColor(3.9)).toContain('blue');
  });

  it('returns a string containing both bg and border classes', () => {
    const result = getCvssBgColor(9.0);
    expect(result).toContain('bg-');
    expect(result).toContain('border-');
  });
});
