/**
 * @file StatCard.jsx
 * Small info card for a single metric.
 */

/**
 * @param {{ label: string, value: string|number, sub?: string, accent?: string }} props
 */
export function StatCard({ label, value, sub, accent = 'text-accent-cyan' }) {
  return (
    <div className="card flex flex-col gap-1 min-w-0">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${accent} truncate`}>{value}</span>
      {sub && <span className="text-xs text-muted font-mono">{sub}</span>}
    </div>
  );
}
