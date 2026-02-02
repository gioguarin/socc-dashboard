import { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Clock, FolderKanban } from 'lucide-react';
import type { Project, CalendarEvent } from '../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';

/** Compact calendar/deadlines widget for the dashboard. */
export function CalendarWidget() {
  const [projects] = useLocalStorage<Project[]>('socc-projects', []);
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>('socc-calendar-events', []);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  /* Merge project deadlines + manual events into unified timeline */
  const allEvents = useMemo(() => {
    const items: Array<{ id: string; title: string; date: string; type: 'deadline' | 'event'; projectName?: string }> = [];

    /* Project deadlines */
    for (const p of projects) {
      if (p.deadline && p.status !== 'completed') {
        items.push({ id: p.id, title: p.name, date: p.deadline, type: 'deadline', projectName: p.name });
      }
    }

    /* Manual events */
    for (const e of events) {
      items.push({ id: e.id, title: e.title, date: e.date, type: e.type });
    }

    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return items;
  }, [projects, events]);

  /* Upcoming items (next 30 days) */
  const upcoming = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return allEvents.filter((e) => {
      const d = new Date(e.date);
      return d >= now && d <= cutoff;
    });
  }, [allEvents]);

  /* Dates with events for the mini calendar */
  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    for (const e of allEvents) {
      dates.add(e.date.split('T')[0]);
    }
    return dates;
  }, [allEvents]);

  /* Calendar grid */
  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<{ day: number; isToday: boolean; hasEvent: boolean } | null> = [];

    /* Empty cells for alignment */
    for (let i = 0; i < firstDay; i++) days.push(null);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        isToday: dateStr === todayStr,
        hasEvent: eventDates.has(dateStr),
      });
    }
    return days;
  }, [currentMonth, eventDates]);

  const monthLabel = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () =>
    setCurrentMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { ...m, month: m.month - 1 }));
  const nextMonth = () =>
    setCurrentMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { ...m, month: m.month + 1 }));

  const addEvent = () => {
    if (!newTitle.trim() || !newDate) return;
    setEvents((prev) => [
      ...prev,
      { id: `evt-${Date.now()}`, title: newTitle.trim(), date: newDate, type: 'event', projectId: null },
    ]);
    setNewTitle('');
    setNewDate('');
    setShowAddEvent(false);
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-socc-border/30">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-socc-cyan" />
          <h3 className="text-xs font-semibold text-gray-200">Calendar & Deadlines</h3>
        </div>
        <button
          onClick={() => setShowAddEvent((v) => !v)}
          className="p-1 rounded-md text-gray-500 hover:text-socc-cyan hover:bg-socc-cyan/10 transition-colors"
          title="Add event"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3 scrollbar-thin">
        {/* Add event form */}
        {showAddEvent && (
          <div className="flex flex-col gap-2 p-3 bg-socc-surface/60 rounded-lg border border-socc-border/40">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Event title"
              className="bg-socc-card/60 border border-socc-border/40 rounded-md px-2.5 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:border-socc-cyan/50 focus:outline-none"
            />
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="bg-socc-card/60 border border-socc-border/40 rounded-md px-2.5 py-1.5 text-xs text-gray-200 focus:border-socc-cyan/50 focus:outline-none"
            />
            <div className="flex justify-end gap-1.5">
              <button onClick={() => setShowAddEvent(false)} className="px-2 py-1 text-[10px] text-gray-400 hover:text-gray-200">Cancel</button>
              <button onClick={addEvent} disabled={!newTitle.trim() || !newDate} className="px-2 py-1 text-[10px] bg-socc-cyan/15 text-socc-cyan rounded-md disabled:opacity-40">Add</button>
            </div>
          </div>
        )}

        {/* Mini calendar */}
        <div className="bg-socc-card/40 rounded-lg p-3 border border-socc-border/30">
          <div className="flex items-center justify-between mb-2">
            <button onClick={prevMonth} className="p-0.5 text-gray-500 hover:text-gray-300"><ChevronLeft className="w-3.5 h-3.5" /></button>
            <span className="text-[11px] font-medium text-gray-300">{monthLabel}</span>
            <button onClick={nextMonth} className="p-0.5 text-gray-500 hover:text-gray-300"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-[9px] text-gray-600 py-0.5">{d}</div>
            ))}
            {calendarDays.map((cell, i) => (
              <div
                key={i}
                className={`text-[10px] py-1 rounded-md relative ${
                  cell?.isToday
                    ? 'bg-socc-cyan/20 text-socc-cyan font-bold'
                    : cell
                    ? 'text-gray-400'
                    : ''
                }`}
              >
                {cell?.day}
                {cell?.hasEvent && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-socc-amber" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming timeline */}
        <div>
          <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Upcoming</h4>
          {upcoming.length === 0 ? (
            <p className="text-[10px] text-gray-600 py-2 text-center">No upcoming events</p>
          ) : (
            <div className="space-y-1.5">
              {upcoming.map((e) => {
                const d = new Date(e.date);
                const isManual = e.type === 'event';
                return (
                  <div key={e.id + e.date} className="flex items-center gap-2 px-2.5 py-1.5 bg-socc-card/40 rounded-md border border-socc-border/20 group">
                    {e.type === 'deadline' ? (
                      <FolderKanban className="w-3 h-3 text-amber-400 shrink-0" />
                    ) : (
                      <Clock className="w-3 h-3 text-socc-cyan shrink-0" />
                    )}
                    <span className="flex-1 text-[10px] text-gray-300 truncate">{e.title}</span>
                    <span className="text-[9px] text-gray-500 shrink-0">
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {isManual && (
                      <button
                        onClick={() => removeEvent(e.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-600 hover:text-socc-red transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
