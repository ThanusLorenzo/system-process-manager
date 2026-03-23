/**
 * @file useSystemStats.test.js
 * Tests for the custom hook — mocks Socket.IO to avoid real network calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mock socket.io-client before importing the hook ──────────────────────────

const mockSocket = {
  on: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

import { useSystemStats } from '../../hooks/useSystemStats';

// Helper: grab the registered handler for a given event
function getHandler(event) {
  const call = mockSocket.on.mock.calls.find(([e]) => e === event);
  return call ? call[1] : null;
}

const MOCK_SNAPSHOT = {
  timestamp: Date.now(),
  cpu: { total: 45, user: 30, system: 15, cores: [50, 40] },
  memory: { totalMiB: 8192, usedMiB: 4096, freeMiB: 4096, usedPercent: 50 },
  processes: [],
};

describe('useSystemStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in "connecting" status', () => {
    const { result } = renderHook(() => useSystemStats());
    expect(result.current.status).toBe('connecting');
    expect(result.current.snapshot).toBeNull();
    expect(result.current.history).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('transitions to "connected" on socket connect event', () => {
    const { result } = renderHook(() => useSystemStats());

    act(() => {
      getHandler('connect')?.();
    });

    expect(result.current.status).toBe('connected');
  });

  it('stores snapshot and appends to history on system:snapshot', () => {
    const { result } = renderHook(() => useSystemStats());

    act(() => {
      getHandler('system:snapshot')?.(MOCK_SNAPSHOT);
    });

    expect(result.current.status).toBe('connected');
    expect(result.current.snapshot).toEqual(MOCK_SNAPSHOT);
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].cpu).toBe(45);
    expect(result.current.history[0].memory).toBe(50);
  });

  it('accumulates history across multiple snapshots', () => {
    const { result } = renderHook(() => useSystemStats());

    act(() => {
      getHandler('system:snapshot')?.(MOCK_SNAPSHOT);
      getHandler('system:snapshot')?.({ ...MOCK_SNAPSHOT, timestamp: Date.now() + 2000 });
      getHandler('system:snapshot')?.({ ...MOCK_SNAPSHOT, timestamp: Date.now() + 4000 });
    });

    expect(result.current.history).toHaveLength(3);
  });

  it('transitions to "disconnected" on disconnect event', () => {
    const { result } = renderHook(() => useSystemStats());

    act(() => {
      getHandler('connect')?.();
    });
    act(() => {
      getHandler('disconnect')?.();
    });

    expect(result.current.status).toBe('disconnected');
  });

  it('stores error message on system:error event', () => {
    const { result } = renderHook(() => useSystemStats());

    act(() => {
      getHandler('system:error')?.({ message: 'Failed to collect metrics.' });
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Failed to collect metrics.');
  });

  it('calls socket.disconnect on unmount', () => {
    const { unmount } = renderHook(() => useSystemStats());
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalledOnce();
  });
});
