/**
 * Live timeline with real-time event blocks.
 * Shows a vertical time axis with events positioned at their actual times.
 * A "now" line moves in real time.
 */

import { useMemo, useRef, useEffect } from 'react';
import type { ParsedCalendarEvent, CalendarTimeRange } from '../../types';

interface CalendarTimelineProps {
  events: ParsedCalendarEvent[];
  rangeStart: Date;
  rangeEnd: Date;
  now: Date;
  timeRange: CalendarTimeRange;
}

export function CalendarTimeline({ events, rangeStart, rangeEnd, now, timeRange }: CalendarTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nowRef = useRef<HTMLDivElement>(null);
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();

  // Scroll to "now" on mount and range change
  useEffect(() => {
    if (nowRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const nowEl = nowRef.current;
      const scrollTo = nowEl.offsetTop - container.clientHeight / 3;
      container.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' });
    }
  }, [timeRange]);

  // Generate time slot labels
  const timeSlots = useMemo(() => {
    const slots: { time: Date; label: string; isDay: boolean }[] = [];
    const cursor = new Date(rangeStart);

    let intervalMinutes: number;
    switch (timeRange) {
      case '12h':
        intervalMinutes = 60;
        break;
      case '24h':
        intervalMinutes = 60;
        break;
      case '72h':
        intervalMinutes = 180;
        break;
      case '1w':
        intervalMinutes = 360;
        break;
      case '30d':
        intervalMinutes = 1440;
        break;
    }

    // Align to slot boundary
    cursor.setMinutes(Math.floor(cursor.getMinutes() / intervalMinutes) * intervalMinutes, 0, 0);

    while (cursor <= rangeEnd) {
      const isDay = cursor.getHours() === 0 && cursor.getMinutes() === 0;
      let label: string;

      if (timeRange === '30d') {
        label = cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (timeRange === '1w' || timeRange === '72h') {
        label = isDay
          ? cursor.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          : cursor.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      } else {
        label = cursor.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      }

      slots.push({ time: new Date(cursor), label, isDay });
      cursor.setMinutes(cursor.getMinutes() + intervalMinutes);
    }
    return slots;
  }, [rangeStart, rangeEnd, timeRange]);

  // Position helper: returns top percentage for a given time
  const getPosition = (time: Date): number => {
    const ms = time.getTime() - rangeStart.getTime();
    return Math.max(0, Math.min(100, (ms / totalMs) * 100));
  };

  // Height per slot in px (controls density)
  const slotHeight = useMemo(() => {
    switch (timeRange) {
      case '12h': return 80;
      case '24h': return 60;
      case '72h': return 40;
      case '1w': return 50;
      case '30d': return 40;
    }
  }, [timeRange]);

  const totalHeight = timeSlots.length * slotHeight;

  // Now indicator position
  const nowPos = getPosition(now);
  const isNowVisible = now >= rangeStart && now <= rangeEnd;

  // Lay out events into columns to handle overlaps
  const eventBlocks = useMemo(() => {
    const blocks: Array<{
      event: ParsedCalendarEvent;
      top: number;
      height: number;
      column: number;
      totalColumns: number;
    }> = [];

    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    // Simple greedy column assignment
    const columns: number[][] = []; // each column is array of block indices

    for (const event of sortedEvents) {
      const eStart = Math.max(new Date(event.start).getTime(), rangeStart.getTime());
      const eEnd = Math.min(new Date(event.end).getTime(), rangeEnd.getTime());

      const top = ((eStart - rangeStart.getTime()) / totalMs) * totalHeight;
      const minHeight = event.allDay ? slotHeight * 0.5 : Math.max(20, ((eEnd - eStart) / totalMs) * totalHeight);

      // Find first column where this event doesn't overlap
      let col = 0;
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const lastIdx = columns[c][columns[c].length - 1];
        const lastBlock = blocks[lastIdx];
        if (lastBlock && lastBlock.top + lastBlock.height <= top) {
          columns[c].push(blocks.length);
          col = c;
          placed = true;
          break;
        }
      }
      if (!placed) {
        col = columns.length;
        columns.push([blocks.length]);
      }

      blocks.push({ event, top, height: minHeight, column: col, totalColumns: 0 });
    }

    // Set totalColumns for each block
    const numCols = columns.length || 1;
    for (const block of blocks) {
      block.totalColumns = numCols;
    }

    return blocks;
  }, [events, rangeStart, rangeEnd, totalMs, totalHeight, slotHeight]);

  return (
    <div className="h-full flex flex-col">
      {/* Timeline header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-socc-border/20 shrink-0">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Live Timeline</span>
        <span className="text-[10px] text-gray-600 ml-auto">
          {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
        </span>
      </div>

      {/* Scrollable timeline */}
      <div ref={scrollRef} className="flex-1 overflow-auto relative">
        <div className="relative" style={{ height: totalHeight, minHeight: '100%' }}>
          {/* Time slot gridlines and labels */}
          {timeSlots.map((slot, i) => {
            const top = (i / timeSlots.length) * totalHeight;
            return (
              <div
                key={i}
                className="absolute left-0 right-0 flex items-start"
                style={{ top }}
              >
                <div className={`w-16 sm:w-20 shrink-0 pr-2 text-right ${slot.isDay ? 'text-gray-300 font-semibold' : 'text-gray-600'}`}>
                  <span className="text-[10px] leading-none">{slot.label}</span>
                </div>
                <div className={`flex-1 border-t ${slot.isDay ? 'border-socc-border/40' : 'border-socc-border/15'}`} />
              </div>
            );
          })}

          {/* Event blocks */}
          <div className="absolute left-16 sm:left-20 right-2 top-0 bottom-0">
            {eventBlocks.map((block) => {
              const colWidth = 100 / block.totalColumns;
              const left = block.column * colWidth;
              return (
                <div
                  key={block.event.id}
                  className="absolute rounded-lg border overflow-hidden cursor-default
                    hover:brightness-110 hover:shadow-lg transition-all duration-150 group"
                  style={{
                    top: block.top,
                    height: Math.max(24, block.height),
                    left: `${left}%`,
                    width: `${colWidth - 1}%`,
                    backgroundColor: block.event.color + '20',
                    borderColor: block.event.color + '50',
                  }}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                    style={{ backgroundColor: block.event.color }}
                  />
                  <div className="pl-2.5 pr-2 py-1 h-full flex flex-col justify-center min-w-0">
                    <p className="text-[11px] text-gray-200 font-medium truncate leading-tight">{block.event.title}</p>
                    {block.height > 32 && (
                      <p className="text-[9px] text-gray-500 truncate mt-0.5">
                        {block.event.allDay
                          ? 'All day'
                          : `${formatTime(new Date(block.event.start))} – ${formatTime(new Date(block.event.end))}`}
                      </p>
                    )}
                    {block.height > 48 && block.event.location && (
                      <p className="text-[9px] text-gray-600 truncate">{block.event.location}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Now indicator */}
            {isNowVisible && (
              <div
                ref={nowRef}
                className="absolute left-0 right-0 z-10 pointer-events-none"
                style={{ top: `${nowPos}%` }}
              >
                <div className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shadow-md shadow-red-500/30" />
                  <div className="flex-1 h-[2px] bg-gradient-to-r from-red-500 to-red-500/0" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
