/**
 * @module systemParser
 * Pure functions for normalising raw systeminformation data.
 * Keeping this layer free of side-effects makes unit testing trivial.
 */

/**
 * Clamp a number to [0, 100] and round to two decimal places.
 * @param {number} value
 * @returns {number}
 */
export function clampPercent(value) {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)) * 100) / 100;
}

/**
 * Convert bytes to mebibytes rounded to two decimals.
 * @param {number} bytes
 * @returns {number}
 */
export function bytesToMiB(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) return 0;
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

/**
 * Parse raw CPU load data from systeminformation.
 * @param {import('systeminformation').Systeminformation.CurrentLoadData} raw
 * @returns {{ total: number, user: number, system: number, cores: number[] }}
 */
export function parseCpuLoad(raw) {
  if (!raw || typeof raw !== 'object') {
    return { total: 0, user: 0, system: 0, cores: [] };
  }

  const cores = Array.isArray(raw.cpus)
    ? raw.cpus.map((c) => clampPercent(c.load))
    : [];

  return {
    total: clampPercent(raw.currentLoad),
    user: clampPercent(raw.currentLoadUser),
    system: clampPercent(raw.currentLoadSystem),
    cores,
  };
}

/**
 * Parse raw memory data from systeminformation.
 * @param {import('systeminformation').Systeminformation.MemData} raw
 * @returns {{ totalMiB: number, usedMiB: number, freeMiB: number, usedPercent: number }}
 */
export function parseMemory(raw) {
  if (!raw || typeof raw !== 'object') {
    return { totalMiB: 0, usedMiB: 0, freeMiB: 0, usedPercent: 0 };
  }

  const totalMiB = bytesToMiB(raw.total);
  const usedMiB = bytesToMiB(raw.used);
  const freeMiB = bytesToMiB(raw.free);
  const usedPercent =
    totalMiB > 0 ? clampPercent((usedMiB / totalMiB) * 100) : 0;

  return { totalMiB, usedMiB, freeMiB, usedPercent };
}

/**
 * Parse and sanitise the list of running processes.
 * @param {import('systeminformation').Systeminformation.ProcessesData} raw
 * @returns {Array<{ pid: number, name: string, cpu: number, memMiB: number, state: string, command: string }>}
 */
export function parseProcessList(raw) {
  if (!raw || !Array.isArray(raw.list)) return [];

  return raw.list
    .filter((p) => p && typeof p === 'object')
    .map((p) => ({
      pid: Number(p.pid) || 0,
      name: String(p.name || 'unknown').slice(0, 64),
      cpu: clampPercent(p.cpu),
      memMiB: bytesToMiB(p.memRss),
      state: String(p.state || '?').slice(0, 1).toUpperCase(),
      command: String(p.command || p.name || '').slice(0, 128),
    }))
    .sort((a, b) => b.cpu - a.cpu);
}
