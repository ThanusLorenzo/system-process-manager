/**
 * @file useSystemStats.js
 * Custom hook that manages the Socket.IO connection lifecycle and exposes
 * the latest system snapshot along with connection metadata.
 */

import { useEffect, useReducer, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const HISTORY_LIMIT = 60; // data points kept for trend charts (~2 min at 2 s interval)

/**
 * @typedef {Object} SystemState
 * @property {'connecting'|'connected'|'disconnected'|'error'} status
 * @property {import('../utils/types').SystemSnapshot|null} snapshot
 * @property {Array<{time: string, cpu: number, memory: number}>} history
 * @property {string|null} error
 */

/** @type {SystemState} */
const initialState = {
  status: 'connecting',
  snapshot: null,
  history: [],
  error: null,
};

/**
 * @param {SystemState} state
 * @param {{ type: string; payload?: unknown }} action
 * @returns {SystemState}
 */
function reducer(state, action) {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, status: 'connected', error: null };

    case 'DISCONNECTED':
      return { ...state, status: 'disconnected' };

    case 'SNAPSHOT': {
      const snapshot = action.payload;
      const entry = {
        time: new Date(snapshot.timestamp).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        cpu: snapshot.cpu.total,
        memory: snapshot.memory.usedPercent,
      };

      const history = [...state.history, entry].slice(-HISTORY_LIMIT);
      return { ...state, status: 'connected', snapshot, history, error: null };
    }

    case 'ERROR':
      return { ...state, status: 'error', error: action.payload };

    default:
      return state;
  }
}

/**
 * Hook that connects to the backend WebSocket and streams real-time metrics.
 *
 * @returns {{
 *   status: SystemState['status'],
 *   snapshot: SystemState['snapshot'],
 *   history: SystemState['history'],
 *   error: SystemState['error'],
 * }}
 */
export function useSystemStats() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    socket.on('connect', () => dispatch({ type: 'CONNECTED' }));

    socket.on('disconnect', () => dispatch({ type: 'DISCONNECTED' }));

    socket.on('system:snapshot', (payload) =>
      dispatch({ type: 'SNAPSHOT', payload }),
    );

    socket.on('system:error', ({ message }) =>
      dispatch({ type: 'ERROR', payload: message }),
    );

    socket.on('connect_error', (err) =>
      dispatch({ type: 'ERROR', payload: `Connection failed: ${err.message}` }),
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    status: state.status,
    snapshot: state.snapshot,
    history: state.history,
    error: state.error,
  };
}
