/**
 * @file TrendChart.jsx
 * Scrolling dual-line area chart for CPU and memory trends.
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#161b22',
  border: '1px solid #30363d',
  borderRadius: 8,
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: 12,
};

const LABEL_STYLE = {
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: 10,
  fill: '#6e7681',
};

/**
 * @param {{ history: Array<{time: string, cpu: number, memory: number}> }} props
 */
export function TrendChart({ history = [] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={history} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gradCpu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#39d5ff" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#39d5ff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradMem" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3dffa0" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3dffa0" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />

        <XAxis
          dataKey="time"
          tick={LABEL_STYLE}
          tickLine={false}
          axisLine={{ stroke: '#30363d' }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={LABEL_STYLE}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}%`}
        />

        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: '#6e7681', marginBottom: 4 }}
          formatter={(value, name) => [`${value.toFixed(1)}%`, name.toUpperCase()]}
        />

        <Legend
          wrapperStyle={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, paddingTop: 8 }}
          formatter={(value) => value.toUpperCase()}
        />

        <Area
          type="monotone"
          dataKey="cpu"
          name="cpu"
          stroke="#39d5ff"
          strokeWidth={2}
          fill="url(#gradCpu)"
          dot={false}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="memory"
          name="memory"
          stroke="#3dffa0"
          strokeWidth={2}
          fill="url(#gradMem)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
