/**
 * CVE-to-vendor mapping utility.
 * Maps CVEs to tracked security/CDN companies based on
 * affected products, description text, and known product names.
 */

export type TrackedVendor = 'akamai' | 'cloudflare' | 'fastly' | 'zscaler' | 'crowdstrike' | 'paloalto' | 'f5';

interface VendorConfig {
  label: string;
  keywords: RegExp;
  color: string;
  bg: string;
  border: string;
}

/** Vendor keyword patterns for matching against CVE data */
export const TRACKED_VENDORS: Record<TrackedVendor, VendorConfig> = {
  akamai: {
    label: 'Akamai',
    keywords: /\bakamai\b/i,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
  },
  cloudflare: {
    label: 'Cloudflare',
    keywords: /\bcloudflare\b/i,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  fastly: {
    label: 'Fastly',
    keywords: /\bfastly\b/i,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  zscaler: {
    label: 'Zscaler',
    keywords: /\bzscaler\b/i,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  crowdstrike: {
    label: 'CrowdStrike',
    keywords: /\bcrowdstrike\b/i,
    color: 'text-red-300',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  paloalto: {
    label: 'Palo Alto',
    keywords: /\b(palo\s*alto|pan-?os|globalprotect|prisma|cortex\s*xdr)\b/i,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
  },
  f5: {
    label: 'F5',
    keywords: /\b(f5\b|big-?ip|nginx|f5\s+networks)\b/i,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
  },
};

/**
 * Check if a CVE affects any tracked vendor based on products and description.
 * Returns array of matched vendor keys.
 */
export function matchVendors(
  affectedProducts?: string[],
  description?: string,
  affectedVendors?: string[]
): TrackedVendor[] {
  /* If server already tagged vendors, use those */
  if (affectedVendors && affectedVendors.length > 0) {
    return affectedVendors.filter(
      (v): v is TrackedVendor => v in TRACKED_VENDORS
    );
  }

  const combined = [
    ...(affectedProducts || []),
    description || '',
  ].join(' ');

  const matched: TrackedVendor[] = [];
  for (const [key, config] of Object.entries(TRACKED_VENDORS)) {
    if (config.keywords.test(combined)) {
      matched.push(key as TrackedVendor);
    }
  }

  return matched;
}
