/**
 * @module socketController
 * Manages WebSocket connections and the metrics broadcast loop.
 */

import { getSystemSnapshot } from '../services/metricsService.js';

const EMIT_INTERVAL_MS = 2000;

/**
 * Attach real-time metrics broadcasting to a Socket.IO server instance.
 * @param {import('socket.io').Server} io
 */
export function attachSocketController(io) {
  /** @type {NodeJS.Timeout | null} */
  let broadcastTimer = null;

  function startBroadcast() {
    if (broadcastTimer) return; // already running

    broadcastTimer = setInterval(async () => {
      try {
        const snapshot = await getSystemSnapshot();
        io.emit('system:snapshot', snapshot);
      } catch (err) {
        console.error('[SocketController] Broadcast error:', err.message);
        io.emit('system:error', { message: 'Failed to collect metrics.' });
      }
    }, EMIT_INTERVAL_MS);

    console.log(`[SocketController] Broadcasting every ${EMIT_INTERVAL_MS}ms`);
  }

  function stopBroadcast() {
    if (broadcastTimer) {
      clearInterval(broadcastTimer);
      broadcastTimer = null;
      console.log('[SocketController] Broadcast stopped.');
    }
  }

  io.on('connection', (socket) => {
    console.log(`[SocketController] Client connected: ${socket.id}`);

    // Start the loop on first connection
    startBroadcast();

    // Send an immediate snapshot so the UI is not blank for 2 s
    getSystemSnapshot()
      .then((snapshot) => socket.emit('system:snapshot', snapshot))
      .catch((err) =>
        socket.emit('system:error', { message: err.message }),
      );

    socket.on('disconnect', (reason) => {
      console.log(`[SocketController] Client disconnected (${reason}): ${socket.id}`);

      // Stop broadcasting when nobody is connected
      if (io.engine.clientsCount === 0) {
        stopBroadcast();
      }
    });
  });
}
