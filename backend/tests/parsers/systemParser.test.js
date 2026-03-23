/**
 * @file systemParser.test.js
 * Unit tests for the pure parser functions.
 * No external dependencies or I/O — runs entirely in memory.
 */

import {
  clampPercent,
  bytesToMiB,
  parseCpuLoad,
  parseMemory,
  parseProcessList,
} from '../../src/parsers/systemParser.js';

// ─── clampPercent ────────────────────────────────────────────────────────────

describe('clampPercent', () => {
  test('returns value unchanged when within [0, 100]', () => {
    expect(clampPercent(42.5)).toBe(42.5);
    expect(clampPercent(0)).toBe(0);
    expect(clampPercent(100)).toBe(100);
  });

  test('clamps values below 0 to 0', () => {
    expect(clampPercent(-10)).toBe(0);
  });

  test('clamps values above 100 to 100', () => {
    expect(clampPercent(150)).toBe(100);
  });

  test('returns 0 for NaN', () => {
    expect(clampPercent(NaN)).toBe(0);
  });

  test('returns 0 for non-numeric input', () => {
    expect(clampPercent('foo')).toBe(0);
    expect(clampPercent(null)).toBe(0);
    expect(clampPercent(undefined)).toBe(0);
  });

  test('rounds to two decimal places', () => {
    expect(clampPercent(33.3333333)).toBe(33.33);
  });
});

// ─── bytesToMiB ──────────────────────────────────────────────────────────────

describe('bytesToMiB', () => {
  test('converts 1 GiB (1073741824 bytes) to 1024 MiB', () => {
    expect(bytesToMiB(1_073_741_824)).toBe(1024);
  });

  test('converts 0 bytes to 0 MiB', () => {
    expect(bytesToMiB(0)).toBe(0);
  });

  test('returns 0 for negative values', () => {
    expect(bytesToMiB(-500)).toBe(0);
  });

  test('returns 0 for NaN', () => {
    expect(bytesToMiB(NaN)).toBe(0);
  });

  test('rounds to two decimal places', () => {
    // 1500 bytes = 1500 / 1048576 ≈ 0.00143 MiB
    expect(bytesToMiB(1500)).toBe(0);
    // 2 MiB exactly
    expect(bytesToMiB(2_097_152)).toBe(2);
  });
});

// ─── parseCpuLoad ────────────────────────────────────────────────────────────

describe('parseCpuLoad', () => {
  test('returns zero-filled object for null input', () => {
    expect(parseCpuLoad(null)).toEqual({ total: 0, user: 0, system: 0, cores: [] });
  });

  test('correctly parses a typical systeminformation payload', () => {
    const raw = {
      currentLoad: 45.67,
      currentLoadUser: 30.1,
      currentLoadSystem: 15.57,
      cpus: [
        { load: 50 },
        { load: 41.34 },
      ],
    };
    const result = parseCpuLoad(raw);
    expect(result.total).toBe(45.67);
    expect(result.user).toBe(30.1);
    expect(result.system).toBe(15.57);
    expect(result.cores).toEqual([50, 41.34]);
  });

  test('handles missing cpus array gracefully', () => {
    const raw = { currentLoad: 20, currentLoadUser: 10, currentLoadSystem: 10 };
    expect(parseCpuLoad(raw).cores).toEqual([]);
  });

  test('clamps CPU values exceeding 100', () => {
    const raw = { currentLoad: 110, currentLoadUser: 60, currentLoadSystem: 60, cpus: [] };
    expect(parseCpuLoad(raw).total).toBe(100);
  });
});

// ─── parseMemory ─────────────────────────────────────────────────────────────

describe('parseMemory', () => {
  test('returns zero-filled object for null input', () => {
    expect(parseMemory(null)).toEqual({
      totalMiB: 0,
      usedMiB: 0,
      freeMiB: 0,
      usedPercent: 0,
    });
  });

  test('calculates usedPercent correctly', () => {
    const raw = {
      total: 8_589_934_592,  // 8 GiB
      used:  4_294_967_296,  // 4 GiB
      free:  4_294_967_296,  // 4 GiB
    };
    const result = parseMemory(raw);
    expect(result.totalMiB).toBe(8192);
    expect(result.usedMiB).toBe(4096);
    expect(result.freeMiB).toBe(4096);
    expect(result.usedPercent).toBe(50);
  });

  test('returns 0 usedPercent when total is 0 (avoid division by zero)', () => {
    const raw = { total: 0, used: 0, free: 0 };
    expect(parseMemory(raw).usedPercent).toBe(0);
  });
});

// ─── parseProcessList ────────────────────────────────────────────────────────

describe('parseProcessList', () => {
  test('returns empty array for null input', () => {
    expect(parseProcessList(null)).toEqual([]);
  });

  test('returns empty array when list property is missing', () => {
    expect(parseProcessList({})).toEqual([]);
  });

  test('maps process fields correctly', () => {
    const raw = {
      list: [
        { pid: 1234, name: 'node', cpu: 5.5, memRss: 104_857_600, state: 'S', command: 'node server.js' },
      ],
    };
    const [proc] = parseProcessList(raw);
    expect(proc.pid).toBe(1234);
    expect(proc.name).toBe('node');
    expect(proc.cpu).toBe(5.5);
    expect(proc.memMiB).toBe(100);
    expect(proc.state).toBe('S');
    expect(proc.command).toBe('node server.js');
  });

  test('sorts processes by CPU usage descending', () => {
    const raw = {
      list: [
        { pid: 1, name: 'low',  cpu: 1,  memRss: 0, state: 'S', command: '' },
        { pid: 2, name: 'high', cpu: 80, memRss: 0, state: 'R', command: '' },
        { pid: 3, name: 'mid',  cpu: 40, memRss: 0, state: 'S', command: '' },
      ],
    };
    const result = parseProcessList(raw);
    expect(result.map((p) => p.name)).toEqual(['high', 'mid', 'low']);
  });

  test('truncates excessively long name and command strings', () => {
    const longName = 'a'.repeat(200);
    const longCmd  = 'b'.repeat(300);
    const raw = { list: [{ pid: 9, name: longName, cpu: 0, memRss: 0, state: 'S', command: longCmd }] };
    const [proc] = parseProcessList(raw);
    expect(proc.name.length).toBe(64);
    expect(proc.command.length).toBe(128);
  });

  test('filters out falsy entries in the list array', () => {
    const raw = { list: [null, undefined, { pid: 99, name: 'ok', cpu: 0, memRss: 0, state: 'S', command: '' }] };
    expect(parseProcessList(raw)).toHaveLength(1);
  });
});
