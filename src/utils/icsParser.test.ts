import { describe, it, expect } from 'vitest';
import { parseIcs } from './icsParser';
import type { IcsEvent } from './icsParser';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal ICS text with one VEVENT */
function makeIcs(props: Record<string, string>): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    ...Object.entries(props).map(([k, v]) => `${k}:${v}`),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\n');
}

// ─── parseIcs ─────────────────────────────────────────────────────────────────

describe('parseIcs', () => {
  describe('basic event parsing', () => {
    it('parses a simple event with all fields', () => {
      const ics = makeIcs({
        UID: 'abc-123',
        SUMMARY: 'Team Standup',
        DESCRIPTION: 'Daily standup meeting',
        LOCATION: 'Room 101',
        DTSTART: '20260218T140000Z',
        DTEND: '20260218T143000Z',
      });

      const events = parseIcs(ics);
      expect(events).toHaveLength(1);
      const ev = events[0];
      expect(ev.uid).toBe('abc-123');
      expect(ev.summary).toBe('Team Standup');
      expect(ev.description).toBe('Daily standup meeting');
      expect(ev.location).toBe('Room 101');
      expect(ev.allDay).toBe(false);
    });

    it('returns an empty array for text with no events', () => {
      const ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR\n';
      expect(parseIcs(ics)).toEqual([]);
    });

    it('returns an empty array for completely empty text', () => {
      expect(parseIcs('')).toEqual([]);
    });

    it('skips events that have no SUMMARY', () => {
      const ics = makeIcs({
        UID: 'no-summary',
        DTSTART: '20260218T140000Z',
        DTEND: '20260218T150000Z',
      });
      expect(parseIcs(ics)).toHaveLength(0);
    });

    it('skips events that have no DTSTART', () => {
      const ics = makeIcs({
        UID: 'no-start',
        SUMMARY: 'Ghost event',
        DTEND: '20260218T150000Z',
      });
      expect(parseIcs(ics)).toHaveLength(0);
    });
  });

  describe('date parsing', () => {
    it('parses UTC datetime (YYYYMMDDTHHMMSSZ) to ISO with Z suffix', () => {
      const ics = makeIcs({
        SUMMARY: 'UTC Event',
        DTSTART: '20260218T140000Z',
        DTEND: '20260218T150000Z',
      });
      const [ev] = parseIcs(ics);
      expect(ev.dtstart).toBe('2026-02-18T14:00:00Z');
      expect(ev.dtend).toBe('2026-02-18T15:00:00Z');
      expect(ev.allDay).toBe(false);
    });

    it('parses local datetime (YYYYMMDDTHHMMSS) to ISO without Z suffix', () => {
      const ics = makeIcs({
        SUMMARY: 'Local Event',
        DTSTART: '20260218T090000',
        DTEND: '20260218T100000',
      });
      const [ev] = parseIcs(ics);
      expect(ev.dtstart).toBe('2026-02-18T09:00:00');
      expect(ev.allDay).toBe(false);
    });

    it('parses all-day events (YYYYMMDD)', () => {
      const ics = makeIcs({
        SUMMARY: 'All Day',
        DTSTART: '20260315',
        DTEND: '20260316',
      });
      const [ev] = parseIcs(ics);
      expect(ev.allDay).toBe(true);
      expect(ev.dtstart).toBe('2026-03-15T00:00:00');
    });

    it('handles DTSTART with TZID parameter (DTSTART;TZID=America/New_York:value)', () => {
      const ics = [
        'BEGIN:VCALENDAR',
        'BEGIN:VEVENT',
        'SUMMARY:TZ Event',
        'DTSTART;TZID=America/New_York:20260218T090000',
        'DTEND;TZID=America/New_York:20260218T100000',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\n');

      const [ev] = parseIcs(ics);
      expect(ev.summary).toBe('TZ Event');
      // The value part after ':' should be parsed
      expect(ev.dtstart).toBe('2026-02-18T09:00:00');
    });
  });

  describe('default end time', () => {
    it('defaults dtend to +1 hour for events with no DTEND', () => {
      const ics = makeIcs({
        SUMMARY: 'No End',
        DTSTART: '20260218T140000Z',
      });
      const [ev] = parseIcs(ics);
      // dtend should be 15:00 UTC
      const start = new Date(ev.dtstart);
      const end = new Date(ev.dtend);
      expect(end.getTime() - start.getTime()).toBe(60 * 60 * 1000);
    });

    it('defaults dtend to next day for all-day events with no DTEND', () => {
      const ics = makeIcs({
        SUMMARY: 'All Day No End',
        DTSTART: '20260315',
      });
      const [ev] = parseIcs(ics);
      expect(ev.allDay).toBe(true);
      const end = new Date(ev.dtend);
      expect(end.getDate()).toBe(16); // next day
    });
  });

  describe('text unescaping', () => {
    it('unescapes \\n in SUMMARY, DESCRIPTION, and LOCATION', () => {
      const ics = makeIcs({
        SUMMARY: 'Line 1\\nLine 2',
        DESCRIPTION: 'Desc\\nMore',
        LOCATION: 'Floor 1\\nRoom 2',
        DTSTART: '20260218T140000Z',
      });
      const [ev] = parseIcs(ics);
      expect(ev.summary).toContain('\n');
      expect(ev.description).toContain('\n');
      expect(ev.location).toContain('\n');
    });

    it('unescapes \\, in field values', () => {
      const ics = makeIcs({
        SUMMARY: 'Event\\, Conference',
        DTSTART: '20260218T140000Z',
      });
      const [ev] = parseIcs(ics);
      expect(ev.summary).toBe('Event, Conference');
    });

    it('unescapes \\\\ to a single backslash', () => {
      const ics = makeIcs({
        SUMMARY: 'Path\\\\to\\\\file',
        DTSTART: '20260218T140000Z',
      });
      const [ev] = parseIcs(ics);
      expect(ev.summary).toBe('Path\\to\\file');
    });
  });

  describe('line unfolding', () => {
    it('unfolds lines that start with a space (RFC 5545 folding)', () => {
      const ics = [
        'BEGIN:VCALENDAR',
        'BEGIN:VEVENT',
        'SUMMARY:Long summ',
        ' ary text',  // folded continuation
        'DTSTART:20260218T140000Z',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      const events = parseIcs(ics);
      expect(events).toHaveLength(1);
      expect(events[0].summary).toBe('Long summary text');
    });
  });

  describe('multiple events', () => {
    it('parses multiple VEVENTs in a single file', () => {
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'UID:evt-1',
        'SUMMARY:First Event',
        'DTSTART:20260218T140000Z',
        'DTEND:20260218T150000Z',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:evt-2',
        'SUMMARY:Second Event',
        'DTSTART:20260219T100000Z',
        'DTEND:20260219T110000Z',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\n');

      const events = parseIcs(ics);
      expect(events).toHaveLength(2);
      expect(events[0].summary).toBe('First Event');
      expect(events[1].summary).toBe('Second Event');
    });
  });

  describe('edge cases', () => {
    it('ignores properties outside of VEVENT blocks', () => {
      const ics = [
        'BEGIN:VCALENDAR',
        'X-WR-CALNAME:My Calendar',
        'UID:outside',
        'BEGIN:VEVENT',
        'UID:inside',
        'SUMMARY:Valid',
        'DTSTART:20260218T140000Z',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\n');

      const events = parseIcs(ics);
      expect(events).toHaveLength(1);
      expect(events[0].uid).toBe('inside');
    });

    it('skips lines without a colon separator', () => {
      const ics = [
        'BEGIN:VCALENDAR',
        'BEGIN:VEVENT',
        'SUMMARY:Valid',
        'DTSTART:20260218T140000Z',
        'NOCOLON',  // no colon — should be silently skipped
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\n');

      expect(() => parseIcs(ics)).not.toThrow();
      expect(parseIcs(ics)).toHaveLength(1);
    });

    it('returns correct IcsEvent shape', () => {
      const ics = makeIcs({
        UID: 'shape-test',
        SUMMARY: 'Shape Check',
        DTSTART: '20260218T140000Z',
        DTEND: '20260218T150000Z',
      });
      const [ev] = parseIcs(ics);
      const keys: (keyof IcsEvent)[] = ['uid', 'summary', 'description', 'location', 'dtstart', 'dtend', 'allDay'];
      keys.forEach((k) => expect(ev).toHaveProperty(k));
    });
  });
});
