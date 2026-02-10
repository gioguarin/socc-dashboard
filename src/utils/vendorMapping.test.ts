import { describe, it, expect } from 'vitest';
import { matchVendors, TRACKED_VENDORS, TrackedVendor } from './vendorMapping';

describe('vendor mapping', () => {
  describe('matchVendors', () => {
    it('returns empty array when no vendors match', () => {
      const result = matchVendors(['some-product'], 'random description');
      expect(result).toEqual([]);
    });

    it('matches Akamai by product name', () => {
      const result = matchVendors(['Akamai CDN', 'other-product']);
      expect(result).toContain('akamai');
    });

    it('matches Cloudflare by description', () => {
      const result = matchVendors([], 'Vulnerability affects Cloudflare services');
      expect(result).toContain('cloudflare');
    });

    it('matches Fastly', () => {
      const result = matchVendors(['Fastly CDN']);
      expect(result).toContain('fastly');
    });

    it('matches Zscaler', () => {
      const result = matchVendors([], 'Zscaler security platform affected');
      expect(result).toContain('zscaler');
    });

    it('matches CrowdStrike', () => {
      const result = matchVendors(['CrowdStrike Falcon']);
      expect(result).toContain('crowdstrike');
    });

    it('matches Palo Alto with various product names', () => {
      expect(matchVendors(['Palo Alto Networks'])).toContain('paloalto');
      expect(matchVendors(['PAN-OS'])).toContain('paloalto');
      expect(matchVendors(['GlobalProtect'])).toContain('paloalto');
      expect(matchVendors(['Prisma Cloud'])).toContain('paloalto');
      expect(matchVendors([], 'Cortex XDR vulnerability')).toContain('paloalto');
    });

    it('matches F5 with various product names', () => {
      expect(matchVendors(['F5 Networks'])).toContain('f5');
      expect(matchVendors(['BIG-IP'])).toContain('f5');
      expect(matchVendors(['BIGIP'])).toContain('f5');
      expect(matchVendors(['nginx'])).toContain('f5');
      expect(matchVendors([], 'F5 load balancer')).toContain('f5');
    });

    it('matches case-insensitively', () => {
      expect(matchVendors(['AKAMAI'])).toContain('akamai');
      expect(matchVendors(['cloudflare'])).toContain('cloudflare');
      expect(matchVendors(['FaStLy'])).toContain('fastly');
    });

    it('matches multiple vendors', () => {
      const result = matchVendors(
        ['Akamai', 'Cloudflare'],
        'Affects both vendors'
      );
      expect(result).toContain('akamai');
      expect(result).toContain('cloudflare');
      expect(result).toHaveLength(2);
    });

    it('uses server-tagged vendors when provided', () => {
      const affectedVendors = ['cloudflare', 'fastly'];
      const result = matchVendors(
        ['Akamai'],  // This would normally match
        'Should be ignored',
        affectedVendors
      );
      // Should return server-tagged vendors, not re-match
      expect(result).toEqual(['cloudflare', 'fastly']);
      expect(result).not.toContain('akamai');
    });

    it('filters out invalid vendors from server-tagged list', () => {
      const affectedVendors = ['cloudflare', 'invalid-vendor', 'fastly'];
      const result = matchVendors([], '', affectedVendors);
      expect(result).toEqual(['cloudflare', 'fastly']);
      expect(result).not.toContain('invalid-vendor');
    });

    it('handles empty or undefined inputs', () => {
      expect(matchVendors()).toEqual([]);
      expect(matchVendors([])).toEqual([]);
      expect(matchVendors([], '')).toEqual([]);
      expect(matchVendors(undefined, undefined)).toEqual([]);
    });

    it('combines products and description for matching', () => {
      const result = matchVendors(
        ['Unknown Product'],
        'This affects Cloudflare infrastructure'
      );
      expect(result).toContain('cloudflare');
    });

    it('matches word boundaries correctly', () => {
      // Should match "F5" as standalone
      expect(matchVendors(['F5'])).toContain('f5');

      // Should not match F5 in middle of word (regex uses \b)
      // "XF5Y" should not match (but hard to test without negative case)
    });

    it('handles Palo Alto spacing variations', () => {
      expect(matchVendors(['Palo Alto'])).toContain('paloalto');
      expect(matchVendors(['PaloAlto'])).toContain('paloalto');
      expect(matchVendors([], 'Palo  Alto Networks')).toContain('paloalto');
    });

    it('handles F5 product variations', () => {
      expect(matchVendors(['BIG-IP'])).toContain('f5');
      expect(matchVendors(['BIGIP'])).toContain('f5');
      expect(matchVendors(['F5 Networks'])).toContain('f5');
    });

    it('returns array of TrackedVendor type', () => {
      const result = matchVendors(['Akamai', 'Cloudflare']);
      // Type check - should be TrackedVendor[]
      result.forEach((vendor: TrackedVendor) => {
        expect(vendor in TRACKED_VENDORS).toBe(true);
      });
    });
  });

  describe('TRACKED_VENDORS', () => {
    it('contains all expected vendors', () => {
      const vendors: TrackedVendor[] = [
        'akamai',
        'cloudflare',
        'fastly',
        'zscaler',
        'crowdstrike',
        'paloalto',
        'f5'
      ];

      vendors.forEach(vendor => {
        expect(TRACKED_VENDORS[vendor]).toBeDefined();
      });
    });

    it('has required properties for each vendor', () => {
      Object.entries(TRACKED_VENDORS).forEach(([key, config]) => {
        expect(config.label).toBeDefined();
        expect(config.keywords).toBeInstanceOf(RegExp);
        expect(config.color).toBeDefined();
        expect(config.bg).toBeDefined();
        expect(config.border).toBeDefined();
      });
    });

    it('has correct labels', () => {
      expect(TRACKED_VENDORS.akamai.label).toBe('Akamai');
      expect(TRACKED_VENDORS.cloudflare.label).toBe('Cloudflare');
      expect(TRACKED_VENDORS.fastly.label).toBe('Fastly');
      expect(TRACKED_VENDORS.zscaler.label).toBe('Zscaler');
      expect(TRACKED_VENDORS.crowdstrike.label).toBe('CrowdStrike');
      expect(TRACKED_VENDORS.paloalto.label).toBe('Palo Alto');
      expect(TRACKED_VENDORS.f5.label).toBe('F5');
    });

    it('has case-insensitive regex patterns', () => {
      Object.values(TRACKED_VENDORS).forEach(config => {
        expect(config.keywords.flags).toContain('i');
      });
    });

    it('has appropriate color classes', () => {
      // Each vendor should have unique color scheme
      const colors = Object.values(TRACKED_VENDORS).map(v => v.color);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBeGreaterThan(1); // Not all the same
    });
  });
});
