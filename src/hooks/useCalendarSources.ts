/**
 * Manages calendar sources (ICS URLs, imported files, manual events)
 * and provides a unified list of parsed events.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { parseIcs } from '../utils/icsParser';
import type { CalendarSource, ParsedCalendarEvent, CalendarEvent, Project } from '../types';

const SOURCES_KEY = 'socc-calendar-sources';
const ICS_CACHE_KEY = 'socc-calendar-ics-cache';

const SOURCE_COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#ec4899', // pink
  '#3b82f6', // blue
  '#f97316', // orange
];

interface IcsCache {
  [sourceId: string]: {
    events: ParsedCalendarEvent[];
    fetchedAt: string;
  };
}

export function useCalendarSources() {
  const [sources, setSources] = useLocalStorage<CalendarSource[]>(SOURCES_KEY, []);
  const [icsCache, setIcsCache] = useLocalStorage<IcsCache>(ICS_CACHE_KEY, {});
  const [loading, setLoading] = useState(false);

  // Manual events and project deadlines from localStorage
  const [manualEvents] = useLocalStorage<CalendarEvent[]>('socc-calendar-events', []);
  const [projects] = useLocalStorage<Project[]>('socc-projects', []);

  const nextColor = useCallback(() => {
    return SOURCE_COLORS[sources.length % SOURCE_COLORS.length];
  }, [sources.length]);

  const addSource = useCallback((name: string, url: string | null, type: CalendarSource['type']) => {
    const source: CalendarSource = {
      id: `src-${Date.now()}`,
      name,
      url,
      color: nextColor(),
      enabled: true,
      lastSynced: null,
      type,
    };
    setSources((prev) => [...prev, source]);
    return source;
  }, [setSources, nextColor]);

  const removeSource = useCallback((id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    setIcsCache((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, [setSources, setIcsCache]);

  const toggleSource = useCallback((id: string) => {
    setSources((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
  }, [setSources]);

  const updateSourceColor = useCallback((id: string, color: string) => {
    setSources((prev) => prev.map((s) => s.id === id ? { ...s, color } : s));
  }, [setSources]);

  /**
   * Import events from raw ICS text and cache them under a source.
   */
  const importIcsText = useCallback((sourceId: string, icsText: string, color: string) => {
    const parsed = parseIcs(icsText);
    const events: ParsedCalendarEvent[] = parsed.map((e) => ({
      id: `${sourceId}-${e.uid || Math.random().toString(36).slice(2)}`,
      uid: e.uid,
      title: e.summary,
      description: e.description,
      location: e.location,
      start: e.dtstart,
      end: e.dtend,
      allDay: e.allDay,
      sourceId,
      color,
    }));

    setIcsCache((prev) => ({
      ...prev,
      [sourceId]: { events, fetchedAt: new Date().toISOString() },
    }));

    setSources((prev) => prev.map((s) =>
      s.id === sourceId ? { ...s, lastSynced: new Date().toISOString() } : s
    ));

    return events.length;
  }, [setIcsCache, setSources]);

  /**
   * Import an ICS file — creates a source and parses the content.
   */
  const importIcsFile = useCallback((file: File) => {
    return new Promise<number>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const source = addSource(file.name.replace(/\.ics$/i, ''), null, 'ics-file');
        const count = importIcsText(source.id, text, source.color);
        resolve(count);
      };
      reader.readAsText(file);
    });
  }, [addSource, importIcsText]);

  /**
   * Fetch and parse an ICS URL. Due to CORS, this requires a proxy.
   * Falls back gracefully if the fetch fails.
   */
  const syncSource = useCallback(async (source: CalendarSource) => {
    if (!source.url || source.type !== 'ics-url') return 0;
    setLoading(true);
    try {
      const res = await fetch(source.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const count = importIcsText(source.id, text, source.color);
      return count;
    } catch {
      // CORS or network error — expected without a backend proxy
      return 0;
    } finally {
      setLoading(false);
    }
  }, [importIcsText]);

  /**
   * Sync all URL-based sources.
   */
  const syncAll = useCallback(async () => {
    for (const source of sources.filter((s) => s.type === 'ics-url' && s.enabled)) {
      await syncSource(source);
    }
  }, [sources, syncSource]);

  // Auto-sync URL sources on mount and every 5 minutes
  useEffect(() => {
    syncAll();
    const interval = setInterval(syncAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * All events unified: ICS cached events + manual events + project deadlines
   */
  const allEvents = useMemo((): ParsedCalendarEvent[] => {
    const events: ParsedCalendarEvent[] = [];

    // ICS cached events from enabled sources
    for (const source of sources) {
      if (!source.enabled) continue;
      const cached = icsCache[source.id];
      if (cached) {
        events.push(...cached.events.map((e) => ({ ...e, color: source.color })));
      }
    }

    // Manual calendar events
    for (const e of manualEvents) {
      events.push({
        id: `manual-${e.id}`,
        uid: e.id,
        title: e.title,
        description: '',
        location: '',
        start: e.date,
        end: e.date,
        allDay: !e.date.includes('T') || e.date.endsWith('T00:00:00'),
        sourceId: 'manual',
        color: '#06b6d4',
      });
    }

    // Project deadlines
    for (const p of projects) {
      if (p.deadline && p.status !== 'completed') {
        events.push({
          id: `project-${p.id}`,
          uid: p.id,
          title: p.name,
          description: `Project deadline`,
          location: '',
          start: p.deadline,
          end: p.deadline,
          allDay: true,
          sourceId: 'projects',
          color: '#f59e0b',
        });
      }
    }

    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return events;
  }, [sources, icsCache, manualEvents, projects]);

  return {
    sources,
    allEvents,
    loading,
    addSource,
    removeSource,
    toggleSource,
    updateSourceColor,
    importIcsFile,
    importIcsText,
    syncSource,
    syncAll,
  };
}
