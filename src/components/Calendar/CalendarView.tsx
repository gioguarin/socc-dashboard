/**
 * Full calendar view with time-range toggles and a live timeline sidebar.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, Link2, Upload, X } from 'lucide-react';
import { useCalendarSources } from '../../hooks/useCalendarSources';
import type { CalendarTimeRange, ParsedCalendarEvent } from '../../types';
import { CalendarTimeline } from './CalendarTimeline';
import { CalendarSourcePanel } from './CalendarSourcePanel';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TIME_RANGES: { value: CalendarTimeRange; label: string }[] = [
  { value: '12h', label: '12H' },
  { value: '24h', label: '24H' },
  { value: '72h', label: '72H' },
  { value: '1w', label: '1W' },
  { value: '30d', label: '30D' },
];

export function CalendarView() {
  const {
    sources,
    allEvents,
    addSource,
    removeSource,
    toggleSource,
    importIcsFile,
    importIcsText,
  } = useCalendarSources();

  const [timeRange, setTimeRange] = useState<CalendarTimeRange>('24h');
  const [showSourcePanel, setShowSourcePanel] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [now, setNow] = useState(new Date());

  // Tick the clock every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Time range bounds
  const { rangeStart, rangeEnd } = useMemo(() => {
    const start = new Date(now);
    const end = new Date(now);
    switch (timeRange) {
      case '12h':
        start.setHours(start.getHours() - 1);
        end.setHours(end.getHours() + 11);
        break;
      case '24h':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case '72h':
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + 2);
        end.setHours(23, 59, 59, 999);
        break;
      case '1w':
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case '30d':
        start.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + 29);
        end.setHours(23, 59, 59, 999);
        break;
    }
    return { rangeStart: start, rangeEnd: end };
  }, [now, timeRange]);

  // Filter events for the active range
  const rangeEvents = useMemo(() => {
    return allEvents.filter((e) => {
      const eStart = new Date(e.start);
      const eEnd = new Date(e.end);
      return eStart <= rangeEnd && eEnd >= rangeStart;
    });
  }, [allEvents, rangeStart, rangeEnd]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<{ day: number; dateStr: string; isToday: boolean; eventCount: number } | null> = [];

    for (let i = 0; i < firstDay; i++) days.push(null);

    const todayStr = formatDateStr(now);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayStart = new Date(year, month, d);
      const dayEnd = new Date(year, month, d, 23, 59, 59, 999);
      const eventCount = allEvents.filter((e) => {
        const eStart = new Date(e.start);
        const eEnd = new Date(e.end);
        return eStart <= dayEnd && eEnd >= dayStart;
      }).length;

      days.push({
        day: d,
        dateStr,
        isToday: dateStr === todayStr,
        eventCount,
      });
    }
    return days;
  }, [currentMonth, allEvents, now]);

  const monthLabel = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () =>
    setCurrentMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { ...m, month: m.month - 1 }));
  const nextMonth = () =>
    setCurrentMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { ...m, month: m.month + 1 }));

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dayStart = new Date(selectedDate + 'T00:00:00');
    const dayEnd = new Date(selectedDate + 'T23:59:59.999');
    return allEvents.filter((e) => {
      const eStart = new Date(e.start);
      const eEnd = new Date(e.end);
      return eStart <= dayEnd && eEnd >= dayStart;
    });
  }, [selectedDate, allEvents]);

  // File drop handler
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith('.ics'));
    files.forEach((f) => importIcsFile(f));
  }, [importIcsFile]);

  return (
    <div
      ref={dropRef}
      className={`h-full flex flex-col overflow-hidden ${dragging ? 'ring-2 ring-socc-cyan ring-inset' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-socc-border/30 shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-socc-cyan" />
          <h2 className="text-sm font-semibold text-gray-200">Calendar</h2>
          <span className="text-[10px] text-gray-500 ml-1">{rangeEvents.length} events</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range toggle */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-socc-bg/80 border border-socc-border/40">
            {TIME_RANGES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTimeRange(value)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150
                  ${timeRange === value
                    ? 'bg-socc-cyan/15 text-socc-cyan shadow-sm shadow-socc-cyan/10'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-socc-hover/50'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowSourcePanel((v) => !v)}
            className="p-2 rounded-lg text-gray-400 hover:text-socc-cyan hover:bg-socc-cyan/10 transition-colors"
            title="Manage calendar sources"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Source panel (collapsible) */}
      {showSourcePanel && (
        <CalendarSourcePanel
          sources={sources}
          onAddSource={addSource}
          onRemoveSource={removeSource}
          onToggleSource={toggleSource}
          onImportFile={importIcsFile}
          onImportIcsText={importIcsText}
          onClose={() => setShowSourcePanel(false)}
        />
      )}

      {/* Main content: calendar + timeline */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Mini calendar + day event list */}
        <div className="w-72 lg:w-80 shrink-0 border-r border-socc-border/20 flex flex-col overflow-hidden hidden md:flex">
          {/* Mini calendar */}
          <div className="p-3 border-b border-socc-border/20">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => { setShowMonthPicker(false); prevMonth(); }} className="p-1 text-gray-500 hover:text-gray-300 rounded-md hover:bg-socc-hover/60">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowMonthPicker((v) => !v)}
                className="text-xs font-semibold text-gray-300 hover:text-socc-cyan px-2 py-0.5 rounded-md hover:bg-socc-cyan/10 transition-colors"
              >
                {monthLabel}
              </button>
              <button onClick={() => { setShowMonthPicker(false); nextMonth(); }} className="p-1 text-gray-500 hover:text-gray-300 rounded-md hover:bg-socc-hover/60">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Month picker grid */}
            {showMonthPicker ? (
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {MONTH_NAMES.map((name, i) => {
                  const isActive = currentMonth.month === i && currentMonth.year === now.getFullYear();
                  const isCurrent = now.getMonth() === i && currentMonth.year === now.getFullYear();
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        setCurrentMonth({ year: currentMonth.year, month: i });
                        setShowMonthPicker(false);
                      }}
                      className={`py-2 rounded-lg text-[11px] font-medium transition-all
                        ${isActive
                          ? 'bg-socc-cyan/15 text-socc-cyan'
                          : isCurrent
                            ? 'text-socc-cyan/70 hover:bg-socc-cyan/10'
                            : 'text-gray-400 hover:bg-socc-hover/60 hover:text-gray-200'
                        }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            ) : (
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="text-[9px] text-gray-600 py-0.5 font-medium">{d}</div>
              ))}
              {calendarDays.map((cell, i) => (
                <button
                  key={i}
                  onClick={() => cell && setSelectedDate(cell.dateStr)}
                  disabled={!cell}
                  className={`text-[10px] py-1.5 rounded-md relative transition-colors
                    ${cell?.isToday
                      ? 'bg-socc-cyan/20 text-socc-cyan font-bold'
                      : cell?.dateStr === selectedDate
                        ? 'bg-socc-cyan/10 text-socc-cyan'
                        : cell
                          ? 'text-gray-400 hover:bg-socc-hover/60 hover:text-gray-200'
                          : ''
                    }`}
                >
                  {cell?.day}
                  {cell && cell.eventCount > 0 && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {cell.eventCount <= 3 ? (
                        Array.from({ length: cell.eventCount }).map((_, j) => (
                          <div key={j} className="w-1 h-1 rounded-full bg-socc-cyan/70" />
                        ))
                      ) : (
                        <div className="w-1 h-1 rounded-full bg-socc-cyan" />
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
            )}
          </div>

          {/* Selected day events */}
          <div className="flex-1 overflow-auto p-3">
            {selectedDate ? (
              <>
                <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h4>
                {selectedDateEvents.length === 0 ? (
                  <p className="text-[11px] text-gray-600 py-4 text-center">No events</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDateEvents.map((e) => (
                      <EventCard key={e.id} event={e} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-[11px] text-gray-600">Select a day to view events</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live timeline */}
        <div className="flex-1 overflow-hidden">
          <CalendarTimeline
            events={rangeEvents}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            now={now}
            timeRange={timeRange}
          />
        </div>
      </div>

      {/* Drag overlay */}
      {dragging && (
        <div className="absolute inset-0 bg-socc-cyan/5 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-socc-surface border border-socc-cyan/40 rounded-xl px-6 py-4 shadow-xl">
            <Upload className="w-6 h-6 text-socc-cyan mx-auto mb-2" />
            <p className="text-sm text-socc-cyan font-medium">Drop .ics file to import</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small event card for the day detail panel */
function EventCard({ event }: { event: ParsedCalendarEvent }) {
  const startTime = event.allDay
    ? 'All day'
    : new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const endTime = event.allDay
    ? ''
    : ' – ' + new Date(event.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="flex items-start gap-2 px-2.5 py-2 bg-socc-card/40 rounded-lg border border-socc-border/20">
      <div className="w-1 h-full min-h-[28px] rounded-full shrink-0 mt-0.5" style={{ backgroundColor: event.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-200 font-medium truncate">{event.title}</p>
        <p className="text-[10px] text-gray-500">
          {startTime}{endTime}
        </p>
        {event.location && (
          <p className="text-[10px] text-gray-600 truncate mt-0.5">{event.location}</p>
        )}
      </div>
    </div>
  );
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
