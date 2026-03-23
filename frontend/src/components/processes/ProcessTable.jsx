/**
 * @file ProcessTable.jsx
 * Searchable, filterable table of running OS processes.
 */

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

const STATE_COLORS = {
  R: 'text-accent-green',
  S: 'text-accent-cyan',
  D: 'text-accent-amber',
  Z: 'text-accent-red',
};

/**
 * @param {{ processes: Array<{pid:number,name:string,cpu:number,memMiB:number,state:string,command:string}> }} props
 */
export function ProcessTable({ processes = [] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return processes;
    return processes.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        String(p.pid).includes(q) ||
        p.command.toLowerCase().includes(q),
    );
  }, [processes, query]);

  return (
    <div className="card flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="font-mono font-semibold text-sm text-gray-300 uppercase tracking-widest">
          Processes{' '}
          <span className="text-muted">({filtered.length})</span>
        </h2>

        <label className="relative flex-1 min-w-[220px] max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="search"
            placeholder="Filter by name, PID or command…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="
              w-full bg-surface border border-border rounded-lg
              pl-8 pr-3 py-1.5 text-sm font-mono text-gray-200
              placeholder-muted focus:outline-none focus:border-accent-cyan
              transition-colors
            "
          />
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="text-muted border-b border-border">
              {['PID', 'Name', 'CPU %', 'MEM MiB', 'State', 'Command'].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left py-2 pr-4 font-medium tracking-wider uppercase whitespace-nowrap"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {filtered.slice(0, 150).map((p) => (
              <tr
                key={p.pid}
                className="border-b border-surface-overlay hover:bg-surface-overlay transition-colors"
              >
                <td className="py-1.5 pr-4 text-muted select-all">{p.pid}</td>

                <td className="py-1.5 pr-4 text-gray-200 max-w-[130px] truncate">
                  {p.name}
                </td>

                <td
                  className={`py-1.5 pr-4 font-semibold ${
                    p.cpu > 70
                      ? 'text-accent-red'
                      : p.cpu > 30
                        ? 'text-accent-amber'
                        : 'text-accent-green'
                  }`}
                >
                  {p.cpu.toFixed(1)}
                </td>

                <td className="py-1.5 pr-4 text-gray-300">
                  {p.memMiB.toFixed(1)}
                </td>

                <td
                  className={`py-1.5 pr-4 ${STATE_COLORS[p.state] ?? 'text-muted'}`}
                >
                  {p.state}
                </td>

                <td className="py-1.5 text-muted max-w-[240px] truncate">
                  {p.command}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-muted italic"
                >
                  No processes match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 150 && (
        <p className="text-xs text-muted font-mono text-right">
          Showing 150 of {filtered.length} results. Refine your filter to see more.
        </p>
      )}
    </div>
  );
}
