/**
 * Lightweight ICS/iCal parser.
 * Parses VCALENDAR files and extracts VEVENT blocks.
 */

export interface IcsEvent {
  uid: string;
  summary: string;
  description: string;
  location: string;
  dtstart: string;
  dtend: string;
  allDay: boolean;
}

/**
 * Parse an ICS date string into an ISO string.
 * Supports: 20260218T140000Z, 20260218T140000, 20260218
 */
function parseIcsDate(value: string): { iso: string; allDay: boolean } {
  // Strip any TZID prefix — e.g. DTSTART;TZID=America/New_York:20260218T140000
  const clean = value.trim();

  // All-day: 8 digits only (YYYYMMDD)
  if (/^\d{8}$/.test(clean)) {
    const y = clean.slice(0, 4);
    const m = clean.slice(4, 6);
    const d = clean.slice(6, 8);
    return { iso: `${y}-${m}-${d}T00:00:00`, allDay: true };
  }

  // DateTime: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (match) {
    const [, y, mo, d, h, mi, s, z] = match;
    const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${z ? 'Z' : ''}`;
    return { iso, allDay: false };
  }

  // Fallback: return as-is
  return { iso: clean, allDay: false };
}

/**
 * Unfold ICS lines (lines starting with space/tab are continuation of previous line).
 */
function unfoldLines(raw: string): string[] {
  return raw.replace(/\r\n[ \t]/g, '').replace(/\r/g, '').split('\n');
}

/**
 * Parse raw ICS text into an array of events.
 */
export function parseIcs(icsText: string): IcsEvent[] {
  const lines = unfoldLines(icsText);
  const events: IcsEvent[] = [];
  let inEvent = false;
  let current: Partial<IcsEvent> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {
        uid: '',
        summary: '',
        description: '',
        location: '',
        dtstart: '',
        dtend: '',
        allDay: false,
      };
      continue;
    }

    if (trimmed === 'END:VEVENT') {
      if (inEvent && current.summary && current.dtstart) {
        // If no end date, default to start + 1 hour
        if (!current.dtend) {
          const startDate = new Date(current.dtstart);
          if (current.allDay) {
            const next = new Date(startDate);
            next.setDate(next.getDate() + 1);
            current.dtend = next.toISOString();
          } else {
            current.dtend = new Date(startDate.getTime() + 60 * 60 * 1000).toISOString();
          }
        }
        events.push(current as IcsEvent);
      }
      inEvent = false;
      continue;
    }

    if (!inEvent) continue;

    // Parse property:value, handling parameters like DTSTART;TZID=...:value
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const propPart = trimmed.slice(0, colonIdx);
    const value = trimmed.slice(colonIdx + 1);
    const propName = propPart.split(';')[0].toUpperCase();

    switch (propName) {
      case 'UID':
        current.uid = value;
        break;
      case 'SUMMARY':
        current.summary = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
        break;
      case 'DESCRIPTION':
        current.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
        break;
      case 'LOCATION':
        current.location = value.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\\\/g, '\\');
        break;
      case 'DTSTART': {
        const parsed = parseIcsDate(value);
        current.dtstart = parsed.iso;
        current.allDay = parsed.allDay;
        break;
      }
      case 'DTEND': {
        const parsed = parseIcsDate(value);
        current.dtend = parsed.iso;
        break;
      }
    }
  }

  return events;
}
