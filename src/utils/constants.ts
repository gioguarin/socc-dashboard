export const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-500', bar: 'bg-red-500' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-500', bar: 'bg-orange-500' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  low: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-500', bar: 'bg-blue-500' },
  info: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30', dot: 'bg-gray-500', bar: 'bg-gray-500' },
} as const;

export const STATUS_COLORS = {
  new: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  investigating: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  mitigated: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  not_applicable: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  reviewed: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
  flagged: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  dismissed: { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/30' },
} as const;

export const SOURCE_COLORS: Record<string, string> = {
  akamai: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  cloudflare: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  fastly: 'text-red-400 bg-red-500/10 border-red-500/30',
  zscaler: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  crowdstrike: 'text-red-300 bg-red-500/10 border-red-500/30',
  paloalto: 'text-green-400 bg-green-500/10 border-green-500/30',
  f5: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  general: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
} as const;

export const SOURCE_LABELS: Record<string, string> = {
  akamai: 'Akamai',
  cloudflare: 'Cloudflare',
  fastly: 'Fastly',
  zscaler: 'Zscaler',
  crowdstrike: 'CrowdStrike',
  paloalto: 'Palo Alto',
  f5: 'F5',
  general: 'General',
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  product: 'Product',
  security: 'Security',
  business: 'Business',
  research: 'Research',
  incident: 'Incident',
} as const;

export const REFRESH_INTERVAL = 60000; // 1 minute

/** Tracked vendor keys for CVE-to-vendor mapping */
export const TRACKED_VENDOR_KEYS = [
  'akamai', 'cloudflare', 'fastly', 'zscaler', 'crowdstrike', 'paloalto', 'f5',
] as const;

/** Keyboard shortcut definitions */
export const KEYBOARD_SHORTCUTS = [
  { key: 'j', description: 'Next item' },
  { key: 'k', description: 'Previous item' },
  { key: '/', description: 'Focus search' },
  { key: '?', description: 'Show shortcuts' },
  { key: 'Esc', description: 'Close / clear' },
  { key: '1-5', description: 'Switch panels' },
  { key: '6', description: 'Shift Notes' },
  { key: '7', description: 'Projects' },
] as const;
