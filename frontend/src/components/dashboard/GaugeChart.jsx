/**
 * @file GaugeChart.jsx
 * Semi-circular gauge built with Recharts PieChart.
 */

import { PieChart, Pie, Cell } from 'recharts';

const RADIAN = Math.PI / 180;

const COLOR_THRESHOLDS = [
  { limit: 60, fill: '#3dffa0' },  // green — healthy
  { limit: 85, fill: '#ffb340' },  // amber — moderate
  { limit: 101, fill: '#ff5f5f' }, // red   — critical
];

function getColor(value) {
  return COLOR_THRESHOLDS.find((t) => value < t.limit)?.fill ?? '#ff5f5f';
}

/**
 * @param {{ value: number, label: string, unit?: string, size?: number }} props
 */
export function GaugeChart({ value = 0, label, unit = '%', size = 200 }) {
  const clamped = Math.min(100, Math.max(0, value));
  const fill = getColor(clamped);

  // The gauge occupies a 180° arc (startAngle=180, endAngle=0)
  const data = [
    { value: clamped },
    { value: 100 - clamped },
  ];

  const cx = size / 2;
  const cy = size / 2;
  const innerR = size * 0.28;
  const outerR = size * 0.42;

  // Custom needle
  const angle = 180 - clamped * 1.8; // map [0,100] → [180°, 0°]
  const needleLength = outerR - 2;
  const nx = cx + needleLength * Math.cos(-RADIAN * angle);
  const ny = cy + needleLength * Math.sin(-RADIAN * angle);

  return (
    <div className="flex flex-col items-center gap-1" aria-label={`${label}: ${clamped}${unit}`}>
      <div style={{ width: size, height: size / 2 + 20, overflow: 'hidden', position: 'relative' }}>
        <PieChart width={size} height={size}>
          {/* Track */}
          <Pie
            data={[{ value: 100 }]}
            cx={cx}
            cy={cy}
            startAngle={180}
            endAngle={0}
            innerRadius={innerR}
            outerRadius={outerR}
            dataKey="value"
            strokeWidth={0}
            isAnimationActive={false}
          >
            <Cell fill="#21262d" />
          </Pie>

          {/* Value arc */}
          <Pie
            data={data}
            cx={cx}
            cy={cy}
            startAngle={180}
            endAngle={0}
            innerRadius={innerR}
            outerRadius={outerR}
            dataKey="value"
            strokeWidth={0}
            isAnimationActive
            animationBegin={0}
            animationDuration={600}
          >
            <Cell fill={fill} />
            <Cell fill="transparent" />
          </Pie>

          {/* Needle */}
          <g>
            <line
              x1={cx}
              y1={cy}
              x2={nx}
              y2={ny}
              stroke={fill}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={5} fill={fill} />
          </g>
        </PieChart>

        {/* Center text — overlaid absolutely */}
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <span className="text-2xl font-mono font-bold" style={{ color: fill }}>
            {clamped.toFixed(1)}
            <span className="text-sm text-muted">{unit}</span>
          </span>
        </div>
      </div>

      <span className="stat-label">{label}</span>
    </div>
  );
}
