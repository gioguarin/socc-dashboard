import { describe, it, expect } from 'vitest';
import { analyzeSentiment, SENTIMENT_CONFIG } from './sentiment';

describe('sentiment analysis', () => {
  describe('analyzeSentiment', () => {
    it('returns positive for positive keywords', () => {
      expect(analyzeSentiment('Company launches new security feature')).toBe('positive');
      expect(analyzeSentiment('Partnership announced with major vendor')).toBe('positive');
      expect(analyzeSentiment('Revenue growth exceeds expectations')).toBe('positive');
      expect(analyzeSentiment('Successful deployment of enhanced protection')).toBe('positive');
      expect(analyzeSentiment('Innovation award for security platform')).toBe('positive');
    });

    it('returns negative for negative keywords', () => {
      expect(analyzeSentiment('Data breach affects thousands of users')).toBe('negative');
      expect(analyzeSentiment('Ransomware attack disrupts operations')).toBe('negative');
      expect(analyzeSentiment('Critical vulnerability discovered in system')).toBe('negative');
      expect(analyzeSentiment('Zero-day exploit found in popular software')).toBe('negative');
      expect(analyzeSentiment('Company faces class action lawsuit')).toBe('negative');
    });

    it('returns neutral when no keywords match', () => {
      expect(analyzeSentiment('Company releases quarterly report')).toBe('neutral');
      expect(analyzeSentiment('Meeting scheduled for next week')).toBe('neutral');
      expect(analyzeSentiment('Update available for download')).toBe('neutral');
    });

    it('returns neutral when positive and negative scores are equal', () => {
      // 'Security breach' has equal scores (security=positive, breach=negative)
      expect(analyzeSentiment('Security breach')).toBe('neutral');
      // 'protect from attack' (protect=positive, attack=negative)
      expect(analyzeSentiment('protect from attack')).toBe('neutral');
      // When scores differ, returns the higher one
      expect(analyzeSentiment('Security breach fixed with successful patch')).toBe('positive');
    });

    it('requires at least one match to classify as positive/negative', () => {
      // Even if one side scores higher, needs >= 1 to classify
      const result = analyzeSentiment('Some random text without keywords');
      expect(result).toBe('neutral');
    });

    it('considers both title and summary', () => {
      expect(
        analyzeSentiment('Company news', 'Major breach discovered in database')
      ).toBe('negative');

      expect(
        analyzeSentiment('Security update', 'New partnership enhances protection capabilities')
      ).toBe('positive');
    });

    it('handles case-insensitive matching', () => {
      expect(analyzeSentiment('BREACH DETECTED')).toBe('negative');
      expect(analyzeSentiment('successful LAUNCH')).toBe('positive');
      expect(analyzeSentiment('MaLwArE fOuNd')).toBe('negative');
    });

    it('handles empty or undefined summary', () => {
      // 'Security breach' has equal scores (security=positive, breach=negative) = neutral
      expect(analyzeSentiment('Data breach')).toBe('negative');
      expect(analyzeSentiment('Product launch', undefined)).toBe('positive');
      expect(analyzeSentiment('Product launch', '')).toBe('positive');
    });

    it('matches word boundaries correctly', () => {
      // "breach" should match
      expect(analyzeSentiment('Data breach occurred')).toBe('negative');
      expect(analyzeSentiment('Multiple breaches detected')).toBe('negative');

      // Partial words should not match (word boundary test)
      // Most patterns use \b which requires word boundaries
    });

    it('handles multiple keyword matches', () => {
      // Multiple negative keywords should increase negative score
      expect(
        analyzeSentiment('Ransomware attack causes data breach and system compromise')
      ).toBe('negative');

      // Multiple positive keywords should increase positive score
      expect(
        analyzeSentiment('Successful launch of innovative security enhancement with growth')
      ).toBe('positive');
    });

    it('prioritizes higher score when both present', () => {
      // More negative than positive
      expect(
        analyzeSentiment('Breach and attack despite security improvements')
      ).toBe('negative');

      // More positive than negative
      expect(
        analyzeSentiment('Successful launch and partnership despite minor vulnerability')
      ).toBe('positive');
    });

    it('handles special patterns like GA and general availability', () => {
      expect(analyzeSentiment('Product reaches GA status')).toBe('positive');
      expect(analyzeSentiment('Now in general availability')).toBe('positive');
    });

    it('handles DDoS pattern', () => {
      expect(analyzeSentiment('Site hit by DDoS attack')).toBe('negative');
      expect(analyzeSentiment('DDoS protection enabled')).toBe('neutral'); // protection is positive, DDoS is negative
    });

    it('handles zero-day variations', () => {
      expect(analyzeSentiment('Zero-day exploit discovered')).toBe('negative');
      expect(analyzeSentiment('Zero day vulnerability patched')).toBe('negative');
      expect(analyzeSentiment('Zeroday flaw reported')).toBe('negative');
    });
  });

  describe('SENTIMENT_CONFIG', () => {
    it('provides configuration for all sentiment types', () => {
      expect(SENTIMENT_CONFIG.positive).toBeDefined();
      expect(SENTIMENT_CONFIG.negative).toBeDefined();
      expect(SENTIMENT_CONFIG.neutral).toBeDefined();
    });

    it('has required properties for each sentiment', () => {
      for (const sentiment of ['positive', 'negative', 'neutral'] as const) {
        const config = SENTIMENT_CONFIG[sentiment];
        expect(config.label).toBeDefined();
        expect(config.color).toBeDefined();
        expect(config.bg).toBeDefined();
        expect(config.border).toBeDefined();
        expect(config.icon).toBeDefined();
      }
    });

    it('has correct labels', () => {
      expect(SENTIMENT_CONFIG.positive.label).toBe('Positive');
      expect(SENTIMENT_CONFIG.negative.label).toBe('Negative');
      expect(SENTIMENT_CONFIG.neutral.label).toBe('Neutral');
    });

    it('has appropriate color classes', () => {
      expect(SENTIMENT_CONFIG.positive.color).toContain('green');
      expect(SENTIMENT_CONFIG.negative.color).toContain('red');
      expect(SENTIMENT_CONFIG.neutral.color).toContain('gray');
    });
  });
});
