/**
 * @file ProcessTable.test.jsx
 * Component tests for the process table filter behaviour.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProcessTable } from '../../components/processes/ProcessTable';

const MOCK_PROCESSES = [
  { pid: 1,    name: 'systemd',  cpu: 0.1,  memMiB: 8.5,   state: 'S', command: '/sbin/init' },
  { pid: 1234, name: 'node',     cpu: 12.3, memMiB: 140.2,  state: 'S', command: 'node server.js' },
  { pid: 5678, name: 'postgres', cpu: 3.5,  memMiB: 220.0,  state: 'S', command: 'postgres: main' },
  { pid: 9999, name: 'zombieX',  cpu: 0.0,  memMiB: 0.0,    state: 'Z', command: '' },
];

describe('ProcessTable', () => {
  it('renders all processes when no filter is applied', () => {
    render(<ProcessTable processes={MOCK_PROCESSES} />);
    expect(screen.getByText('systemd')).toBeInTheDocument();
    expect(screen.getByText('node')).toBeInTheDocument();
    expect(screen.getByText('postgres')).toBeInTheDocument();
    expect(screen.getByText('zombieX')).toBeInTheDocument();
  });

  it('shows the correct process count in the heading', () => {
    render(<ProcessTable processes={MOCK_PROCESSES} />);
    expect(screen.getByText(`(${MOCK_PROCESSES.length})`)).toBeInTheDocument();
  });

  it('filters processes by name (case-insensitive)', async () => {
    const user = userEvent.setup();
    render(<ProcessTable processes={MOCK_PROCESSES} />);

    const input = screen.getByPlaceholderText(/filter by name/i);
    await user.type(input, 'node');

    expect(screen.getByText('node')).toBeInTheDocument();
    expect(screen.queryByText('postgres')).not.toBeInTheDocument();
    expect(screen.queryByText('systemd')).not.toBeInTheDocument();
  });

  it('filters processes by PID', async () => {
    const user = userEvent.setup();
    render(<ProcessTable processes={MOCK_PROCESSES} />);

    const input = screen.getByPlaceholderText(/filter by name/i);
    await user.type(input, '5678');

    expect(screen.getByText('postgres')).toBeInTheDocument();
    expect(screen.queryByText('node')).not.toBeInTheDocument();
  });

  it('shows "no processes" message when filter matches nothing', async () => {
    const user = userEvent.setup();
    render(<ProcessTable processes={MOCK_PROCESSES} />);

    const input = screen.getByPlaceholderText(/filter by name/i);
    await user.type(input, 'xyznonexistent');

    expect(screen.getByText(/no processes match/i)).toBeInTheDocument();
  });

  it('renders an empty table gracefully when no processes are passed', () => {
    render(<ProcessTable processes={[]} />);
    expect(screen.getByText(/no processes match/i)).toBeInTheDocument();
  });

  it('applies correct state colour class for zombie process', () => {
    render(<ProcessTable processes={MOCK_PROCESSES} />);
    const zombieStateCell = screen.getByText('Z');
    expect(zombieStateCell).toHaveClass('text-accent-red');
  });
});
