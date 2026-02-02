export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateString);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatPrice(price: number): string {
  return price.toFixed(2);
}

export function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}`;
}

export function formatPercent(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatCurrentTime(): string {
  return new Date().toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  });
}

/**
 * Check if currently on shift. Reads config from localStorage
 * (set via Preferences), falling back to defaults.
 * Default: Sun-Wed, 7:00-17:00, America/New_York
 */
export function isOnShift(): boolean {
  let shiftDays = [0, 1, 2, 3]; // Sun-Wed
  let startHour = 7;
  let endHour = 17;
  let tz = 'America/New_York';

  try {
    const stored = localStorage.getItem('socc-shift-config');
    if (stored) {
      const cfg = JSON.parse(stored);
      if (cfg.days) shiftDays = cfg.days;
      if (cfg.startHour != null) startHour = cfg.startHour;
      if (cfg.endHour != null) endHour = cfg.endHour;
      if (cfg.timezone) tz = cfg.timezone;
    }
  } catch {
    // Use defaults
  }

  const now = new Date();
  const localized = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const day = localized.getDay();
  const hour = localized.getHours();
  return shiftDays.includes(day) && hour >= startHour && hour < endHour;
}

export function getCvssColor(score: number): string {
  if (score >= 9.0) return 'text-red-400';
  if (score >= 7.0) return 'text-orange-400';
  if (score >= 4.0) return 'text-amber-400';
  return 'text-blue-400';
}

export function getCvssBgColor(score: number): string {
  if (score >= 9.0) return 'bg-red-500/20 border-red-500/40';
  if (score >= 7.0) return 'bg-orange-500/20 border-orange-500/40';
  if (score >= 4.0) return 'bg-amber-500/20 border-amber-500/40';
  return 'bg-blue-500/20 border-blue-500/40';
}
