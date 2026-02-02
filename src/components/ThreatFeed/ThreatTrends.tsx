import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { ThreatItem } from '../../types';

interface ThreatTrendsProps {
  threats: ThreatItem[];
}

interface DayBucket {
  date: string;
  label: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

/** Build daily severity counts from threat data */
function buildTrendData(threats: ThreatItem[], days: number): DayBucket[] {
  const now = new Date();
  const buckets: DayBucket[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    buckets.push({ date: dateStr, label, critical: 0, high: 0, medium: 0, low: 0, total: 0 });
  }

  for (const t of threats) {
    const tDate = t.publishedAt.slice(0, 10);
    const bucket = buckets.find((b) => b.date === tDate);
    if (!bucket) continue;

    bucket.total++;
    if (t.severity === 'critical') bucket.critical++;
    else if (t.severity === 'high') bucket.high++;
    else if (t.severity === 'medium') bucket.medium++;
    else bucket.low++;
  }

  return buckets;
}

/** Custom tooltip for the trend chart */
function TrendTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  const total = payload.reduce((sum, p) => sum + p.value, 0);
  if (total === 0) return null;

  return (
    <div className="bg-socc-surface border border-socc-border/50 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[10px] text-gray-400 mb-1">{label}</p>
      {payload.filter((p) => p.value > 0).map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-[10px]">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300 capitalize">{p.name}</span>
          <span className="text-gray-400 ml-auto font-mono">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ThreatTrends({ threats }: ThreatTrendsProps) {
  const data7 = useMemo(() => buildTrendData(threats, 7), [threats]);
  const data30 = useMemo(() => buildTrendData(threats, 30), [threats]);

  const total7 = data7.reduce((s, d) => s + d.total, 0);
  const total30 = data30.reduce((s, d) => s + d.total, 0);
  const crit7 = data7.reduce((s, d) => s + d.critical, 0);

  return (
    <div className="px-4 py-3 border-b border-socc-border/20 bg-socc-surface/20">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-3.5 h-3.5 text-socc-cyan" />
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
          Severity Trends
        </span>
        <div className="flex items-center gap-3 ml-auto text-[10px] text-gray-500">
          <span>
            7d: <span className="text-gray-300 font-mono">{total7}</span>
          </span>
          <span>
            30d: <span className="text-gray-300 font-mono">{total30}</span>
          </span>
          {crit7 > 0 && (
            <span className="text-red-400">
              {crit7} critical
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        {/* 7-day chart */}
        <div className="flex-1">
          <span className="text-[9px] text-gray-600 uppercase tracking-wider">7 Day</span>
          <ResponsiveContainer width="100%" height={48}>
            <AreaChart data={data7} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <Tooltip
                content={<TrendTooltip />}
                cursor={{ stroke: 'rgba(6,182,212,0.2)' }}
              />
              <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} strokeWidth={1} />
              <Area type="monotone" dataKey="high" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={1} />
              <Area type="monotone" dataKey="medium" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1} />
              <Area type="monotone" dataKey="low" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 30-day chart */}
        <div className="flex-1">
          <span className="text-[9px] text-gray-600 uppercase tracking-wider">30 Day</span>
          <ResponsiveContainer width="100%" height={48}>
            <AreaChart data={data30} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <Tooltip
                content={<TrendTooltip />}
                cursor={{ stroke: 'rgba(6,182,212,0.2)' }}
              />
              <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} strokeWidth={1} />
              <Area type="monotone" dataKey="high" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={1} />
              <Area type="monotone" dataKey="medium" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1} />
              <Area type="monotone" dataKey="low" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
