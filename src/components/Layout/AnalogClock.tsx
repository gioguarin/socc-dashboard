import { useState, useEffect } from 'react';

interface AnalogClockProps {
  size?: number;
  collapsed?: boolean;
}

export default function AnalogClock({ size = 80, collapsed = false }: AnalogClockProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Use America/New_York to match header time
  const estString = now.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const [h, m, s] = estString.split(':').map(Number);

  const secondDeg = s * 6;
  const minuteDeg = m * 6 + s * 0.1;
  const hourDeg = (h % 12) * 30 + m * 0.5;

  const r = size / 2;
  const center = r;

  if (collapsed) {
    return (
      <div className="flex items-center justify-center px-2 py-3">
        <svg width={36} height={36} viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" className="text-socc-border/40" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="1.5" className="fill-socc-cyan" />
          {/* Hour */}
          <line
            x1="18" y1="18"
            x2={18 + 8 * Math.sin((hourDeg * Math.PI) / 180)}
            y2={18 - 8 * Math.cos((hourDeg * Math.PI) / 180)}
            stroke="currentColor" className="text-gray-300" strokeWidth="2" strokeLinecap="round"
          />
          {/* Minute */}
          <line
            x1="18" y1="18"
            x2={18 + 11 * Math.sin((minuteDeg * Math.PI) / 180)}
            y2={18 - 11 * Math.cos((minuteDeg * Math.PI) / 180)}
            stroke="currentColor" className="text-gray-400" strokeWidth="1.5" strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  const tickMarks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    const isMain = i % 3 === 0;
    const outerR = r - 4;
    const innerR = isMain ? r - 10 : r - 7;
    return (
      <line
        key={i}
        x1={center + innerR * Math.sin(angle)}
        y1={center - innerR * Math.cos(angle)}
        x2={center + outerR * Math.sin(angle)}
        y2={center - outerR * Math.cos(angle)}
        stroke="currentColor"
        className={isMain ? 'text-gray-400' : 'text-gray-600'}
        strokeWidth={isMain ? 1.5 : 0.75}
        strokeLinecap="round"
      />
    );
  });

  return (
    <div className="flex flex-col items-center gap-1.5 px-2 py-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Face */}
        <circle cx={center} cy={center} r={r - 2} fill="none" stroke="currentColor" className="text-socc-border/30" strokeWidth="1.5" />
        <circle cx={center} cy={center} r={r - 3} fill="none" stroke="currentColor" className="text-socc-border/10" strokeWidth="0.5" />

        {/* Tick marks */}
        {tickMarks}

        {/* Hour hand */}
        <line
          x1={center} y1={center}
          x2={center + (r * 0.45) * Math.sin((hourDeg * Math.PI) / 180)}
          y2={center - (r * 0.45) * Math.cos((hourDeg * Math.PI) / 180)}
          stroke="currentColor" className="text-gray-200" strokeWidth="2.5" strokeLinecap="round"
        />

        {/* Minute hand */}
        <line
          x1={center} y1={center}
          x2={center + (r * 0.65) * Math.sin((minuteDeg * Math.PI) / 180)}
          y2={center - (r * 0.65) * Math.cos((minuteDeg * Math.PI) / 180)}
          stroke="currentColor" className="text-gray-300" strokeWidth="1.5" strokeLinecap="round"
        />

        {/* Second hand */}
        <line
          x1={center} y1={center + (r * 0.1)}
          x2={center + (r * 0.7) * Math.sin((secondDeg * Math.PI) / 180)}
          y2={center - (r * 0.7) * Math.cos((secondDeg * Math.PI) / 180)}
          className="text-socc-cyan" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round"
        />

        {/* Center dot */}
        <circle cx={center} cy={center} r="2.5" className="fill-socc-cyan" />
      </svg>

      {/* Digital time below */}
      <span className="text-[10px] font-mono text-gray-500 tabular-nums">
        {now.toLocaleTimeString('en-US', {
          timeZone: 'America/New_York',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })} ET
      </span>
    </div>
  );
}
