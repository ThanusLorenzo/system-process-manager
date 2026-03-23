/**
 * @file App.jsx
 * Root component — composes the full dashboard layout.
 */

import { Activity, Cpu, MemoryStick, WifiOff, Loader2, Github } from 'lucide-react';
import { useSystemStats } from './hooks/useSystemStats';
import { GaugeChart } from './components/dashboard/GaugeChart';
import { TrendChart } from './components/dashboard/TrendChart';
import { StatCard } from './components/ui/StatCard';
import { ProcessTable } from './components/processes/ProcessTable';

/** Maps connection status → Tailwind classes for the status dot */
const STATUS_DOT = {
  connected: 'bg-accent-green animate-pulse-slow',
  connecting: 'bg-accent-amber animate-pulse',
  disconnected: 'bg-muted',
  error: 'bg-accent-red animate-pulse',
};

export default function App() {
  const { status, snapshot, history, error } = useSystemStats();

  const cpu = snapshot?.cpu;
  const mem = snapshot?.memory;
  const procs = snapshot?.processes ?? [];

  return (
    <div className="min-h-screen px-4 py-6 md:px-10 max-w-7xl mx-auto space-y-6">

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Activity size={22} className="text-accent-cyan" aria-hidden />
          <h1 className="font-mono font-bold text-lg tracking-tight text-gray-100">
            System<span className="text-accent-cyan">PM</span>
          </h1>
          <span className="badge bg-surface-overlay text-muted border border-border hidden sm:inline-flex">
            Real-Time Monitor
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div
            className="flex items-center gap-2 text-xs font-mono text-muted"
            aria-live="polite"
            aria-label={`Connection status: ${status}`}
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`}
            />
            {status.toUpperCase()}
            {status === 'connecting' && (
              <Loader2 size={12} className="animate-spin" />
            )}
          </div>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-gray-200 transition-colors"
            aria-label="GitHub repository"
          >
            <Github size={16} />
          </a>
        </div>
      </header>

      {/* ── Error banner ──────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 card border border-accent-red/40
                     text-accent-red text-sm font-mono"
        >
          <WifiOff size={16} aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {/* ── Stat pills row ────────────────────────────────────────── */}
      <section
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        aria-label="Summary statistics"
      >
        <StatCard
          label="CPU Total"
          value={`${(cpu?.total ?? 0).toFixed(1)}%`}
          sub={`User ${(cpu?.user ?? 0).toFixed(1)}% · Sys ${(cpu?.system ?? 0).toFixed(1)}%`}
          accent="text-accent-cyan"
        />
        <StatCard
          label="CPU Cores"
          value={cpu?.cores?.length ?? '—'}
          sub="logical processors"
          accent="text-accent-cyan"
        />
        <StatCard
          label="RAM Used"
          value={`${(mem?.usedPercent ?? 0).toFixed(1)}%`}
          sub={`${(mem?.usedMiB ?? 0).toFixed(0)} / ${(mem?.totalMiB ?? 0).toFixed(0)} MiB`}
          accent="text-accent-green"
        />
        <StatCard
          label="Processes"
          value={procs.length}
          sub="running"
          accent="text-accent-amber"
        />
      </section>

      {/* ── Gauges ────────────────────────────────────────────────── */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        aria-label="CPU and memory gauges"
      >
        {/* CPU gauge card */}
        <div className="card flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 self-start">
            <Cpu size={15} className="text-accent-cyan" aria-hidden />
            <span className="stat-label">CPU Load</span>
          </div>

          <GaugeChart value={cpu?.total ?? 0} label="Total" size={220} />

          {/* Per-core mini bars */}
          {cpu?.cores && cpu.cores.length > 0 && (
            <div className="w-full">
              <p className="stat-label mb-2">Cores</p>
              <div className="grid grid-cols-4 gap-1.5">
                {cpu.cores.map((c, i) => (
                  <div key={i} title={`Core ${i}: ${c.toFixed(1)}%`}>
                    <div className="h-1 rounded-full bg-surface-overlay overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${c}%`,
                          backgroundColor:
                            c > 70 ? '#ff5f5f' : c > 40 ? '#ffb340' : '#39d5ff',
                        }}
                      />
                    </div>
                    <p className="text-[9px] font-mono text-muted mt-0.5 text-center">
                      {c.toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Memory gauge card */}
        <div className="card flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 self-start">
            <MemoryStick size={15} className="text-accent-green" aria-hidden />
            <span className="stat-label">Memory (RAM)</span>
          </div>

          <GaugeChart value={mem?.usedPercent ?? 0} label="Used" size={220} />

          <div className="w-full space-y-2">
            {[
              { label: 'Used', mib: mem?.usedMiB ?? 0, color: '#3dffa0' },
              { label: 'Free', mib: mem?.freeMiB ?? 0, color: '#39d5ff' },
            ].map(({ label, mib, color }) => (
              <div key={label} className="flex items-center gap-3 text-xs font-mono">
                <span className="w-10 text-muted">{label}</span>
                <div className="flex-1 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${mem?.totalMiB ? (mib / mem.totalMiB) * 100 : 0}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span className="text-gray-300 w-20 text-right">
                  {mib.toFixed(0)} MiB
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trend chart ───────────────────────────────────────────── */}
      <section className="card" aria-label="Historical trend chart">
        <h2 className="stat-label mb-4">2-Minute Trend — CPU & Memory</h2>
        {history.length < 2 ? (
          <div className="flex items-center justify-center h-52 text-muted text-sm font-mono">
            <Loader2 size={16} className="animate-spin mr-2" />
            Collecting data…
          </div>
        ) : (
          <TrendChart history={history} />
        )}
      </section>

      {/* ── Process table ─────────────────────────────────────────── */}
      <section aria-label="Process list">
        <ProcessTable processes={procs} />
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="text-center text-xs font-mono text-muted pb-4">
        System Process Manager · Node.js + React · Updates every 2 s
      </footer>
    </div>
  );
}
