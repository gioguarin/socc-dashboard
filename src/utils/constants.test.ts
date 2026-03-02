import { describe, it, expect } from 'vitest';
import {
  SEVERITY_COLORS,
  STATUS_COLORS,
  SOURCE_COLORS,
  SOURCE_LABELS,
  CATEGORY_LABELS,
  REFRESH_INTERVAL,
  TRACKED_VENDOR_KEYS,
  KEYBOARD_SHORTCUTS,
} from './constants';

describe('constants', () => {
  describe('SEVERITY_COLORS', () => {
    it('has entries for all severity levels', () => {
      const levels = ['critical', 'high', 'medium', 'low', 'info'] as const;
      levels.forEach((level) => {
        expect(SEVERITY_COLORS[level]).toBeDefined();
      });
    });

    it('each severity has required color properties', () => {
      Object.entries(SEVERITY_COLORS).forEach(([, config]) => {
        expect(config.bg).toBeDefined();
        expect(config.text).toBeDefined();
        expect(config.border).toBeDefined();
        expect(config.dot).toBeDefined();
        expect(config.bar).toBeDefined();
      });
    });

    it('critical severity uses red', () => {
      expect(SEVERITY_COLORS.critical.text).toContain('red');
    });

    it('high severity uses orange', () => {
      expect(SEVERITY_COLORS.high.text).toContain('orange');
    });

    it('medium severity uses amber', () => {
      expect(SEVERITY_COLORS.medium.text).toContain('amber');
    });

    it('low severity uses blue', () => {
      expect(SEVERITY_COLORS.low.text).toContain('blue');
    });

    it('info severity uses gray', () => {
      expect(SEVERITY_COLORS.info.text).toContain('gray');
    });
  });

  describe('STATUS_COLORS', () => {
    it('has entries for all status values', () => {
      const statuses = ['new', 'investigating', 'mitigated', 'not_applicable', 'reviewed', 'flagged', 'dismissed'] as const;
      statuses.forEach((status) => {
        expect(STATUS_COLORS[status]).toBeDefined();
      });
    });

    it('each status has bg, text, and border properties', () => {
      Object.entries(STATUS_COLORS).forEach(([, config]) => {
        expect(config.bg).toBeDefined();
        expect(config.text).toBeDefined();
        expect(config.border).toBeDefined();
      });
    });

    it('new status uses cyan', () => {
      expect(STATUS_COLORS.new.text).toContain('cyan');
    });

    it('mitigated status uses green', () => {
      expect(STATUS_COLORS.mitigated.text).toContain('green');
    });
  });

  describe('SOURCE_COLORS', () => {
    it('has entries for all tracked vendors, AI companies, and general', () => {
      const sources = [
        'akamai', 'cloudflare', 'fastly', 'zscaler', 'crowdstrike', 'paloalto', 'f5',
        'openai', 'anthropic', 'google_ai', 'meta_ai', 'microsoft_ai', 'world', 'general',
      ];
      sources.forEach((source) => {
        expect(SOURCE_COLORS[source]).toBeDefined();
      });
    });

    it('each source color is a non-empty string', () => {
      Object.values(SOURCE_COLORS).forEach((color) => {
        expect(typeof color).toBe('string');
        expect(color.length).toBeGreaterThan(0);
      });
    });
  });

  describe('SOURCE_LABELS', () => {
    it('has human-readable labels for all sources', () => {
      expect(SOURCE_LABELS.akamai).toBe('Akamai');
      expect(SOURCE_LABELS.cloudflare).toBe('Cloudflare');
      expect(SOURCE_LABELS.fastly).toBe('Fastly');
      expect(SOURCE_LABELS.zscaler).toBe('Zscaler');
      expect(SOURCE_LABELS.crowdstrike).toBe('CrowdStrike');
      expect(SOURCE_LABELS.paloalto).toBe('Palo Alto');
      expect(SOURCE_LABELS.f5).toBe('F5');
      expect(SOURCE_LABELS.openai).toBe('OpenAI');
      expect(SOURCE_LABELS.anthropic).toBe('Anthropic');
      expect(SOURCE_LABELS.google_ai).toBe('Google AI');
      expect(SOURCE_LABELS.meta_ai).toBe('Meta AI');
      expect(SOURCE_LABELS.microsoft_ai).toBe('Microsoft AI');
      expect(SOURCE_LABELS.world).toBe('World');
      expect(SOURCE_LABELS.general).toBe('General');
    });
  });

  describe('CATEGORY_LABELS', () => {
    it('has labels for all categories', () => {
      const categories = ['product', 'security', 'business', 'research', 'incident', 'ai'];
      categories.forEach((cat) => {
        expect(CATEGORY_LABELS[cat]).toBeDefined();
      });
    });

    it('labels are human-readable capitalized strings', () => {
      expect(CATEGORY_LABELS.product).toBe('Product');
      expect(CATEGORY_LABELS.security).toBe('Security');
      expect(CATEGORY_LABELS.business).toBe('Business');
      expect(CATEGORY_LABELS.research).toBe('Research');
      expect(CATEGORY_LABELS.incident).toBe('Incident');
      expect(CATEGORY_LABELS.ai).toBe('AI');
    });
  });

  describe('REFRESH_INTERVAL', () => {
    it('is set to 60 seconds in milliseconds', () => {
      expect(REFRESH_INTERVAL).toBe(60000);
    });

    it('is a positive number', () => {
      expect(REFRESH_INTERVAL).toBeGreaterThan(0);
    });
  });

  describe('TRACKED_VENDOR_KEYS', () => {
    it('contains all expected vendor keys', () => {
      const expected = ['akamai', 'cloudflare', 'fastly', 'zscaler', 'crowdstrike', 'paloalto', 'f5'];
      expected.forEach((vendor) => {
        expect(TRACKED_VENDOR_KEYS).toContain(vendor);
      });
    });

    it('has exactly 7 tracked vendors', () => {
      expect(TRACKED_VENDOR_KEYS.length).toBe(7);
    });
  });

  describe('KEYBOARD_SHORTCUTS', () => {
    it('is a non-empty array', () => {
      expect(KEYBOARD_SHORTCUTS.length).toBeGreaterThan(0);
    });

    it('each shortcut has a key and description', () => {
      KEYBOARD_SHORTCUTS.forEach((shortcut) => {
        expect(shortcut.key).toBeDefined();
        expect(shortcut.description).toBeDefined();
        expect(typeof shortcut.key).toBe('string');
        expect(typeof shortcut.description).toBe('string');
      });
    });

    it('includes essential shortcuts', () => {
      const keys = KEYBOARD_SHORTCUTS.map((s) => s.key);
      expect(keys).toContain('j');
      expect(keys).toContain('k');
      expect(keys).toContain('/');
      expect(keys).toContain('?');
      expect(keys).toContain('Esc');
    });
  });
});
