/**
 * @module metricsService
 * Collects raw OS metrics via systeminformation and returns parsed snapshots.
 */

import si from 'systeminformation';
import { parseCpuLoad, parseMemory, parseProcessList } from '../parsers/systemParser.js';

/**
 * Gather a complete system snapshot: CPU, memory, and top processes.
 * Each collection is wrapped independently so a single failure does not
 * corrupt the entire payload.
 *
 * @returns {Promise<{
 *   timestamp: number,
 *   cpu: ReturnType<typeof parseCpuLoad>,
 *   memory: ReturnType<typeof parseMemory>,
 *   processes: ReturnType<typeof parseProcessList>
 * }>}
 */
export async function getSystemSnapshot() {
  const [cpuRaw, memRaw, procRaw] = await Promise.allSettled([
    si.currentLoad(),
    si.mem(),
    si.processes(),
  ]);

  const cpu = parseCpuLoad(
    cpuRaw.status === 'fulfilled' ? cpuRaw.value : null,
  );
  const memory = parseMemory(
    memRaw.status === 'fulfilled' ? memRaw.value : null,
  );
  const processes = parseProcessList(
    procRaw.status === 'fulfilled' ? procRaw.value : null,
  );

  // Log collection errors without crashing the cycle
  [cpuRaw, memRaw, procRaw].forEach((result, idx) => {
    if (result.status === 'rejected') {
      const labels = ['CPU', 'Memory', 'Processes'];
      console.error(`[MetricsService] ${labels[idx]} collection failed:`, result.reason?.message);
    }
  });

  return {
    timestamp: Date.now(),
    cpu,
    memory,
    processes,
  };
}
