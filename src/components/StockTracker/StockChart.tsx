import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface StockChartProps {
  data: number[];
  positive: boolean;
}

export default function StockChart({ data, positive }: StockChartProps) {
  const chartData = data.map((value, index) => ({ index, value }));
  const color = positive ? '#22c55e' : '#ef4444';

  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`gradient-${positive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={['dataMin', 'dataMax']} hide />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#gradient-${positive ? 'up' : 'down'})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
