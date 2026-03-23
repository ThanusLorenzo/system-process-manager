/**
 * @file server.js
 * Application entry point.
 * Composes Express + Socket.IO and starts the HTTP server.
 */

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { attachSocketController } from './controllers/socketController.js';

const PORT = Number(process.env.PORT) || 3001;

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4173'];

async function bootstrap() {
  const app = createApp();
  const httpServer = createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS,
      methods: ['GET', 'POST'],
    },
    // Reduce overhead: prefer WebSocket, fall back to polling
    transports: ['websocket', 'polling'],
  });

  attachSocketController(io);

  httpServer.listen(PORT, () => {
    console.log(`\n🖥  System Process Manager — Backend`);
    console.log(`   HTTP  → http://localhost:${PORT}`);
    console.log(`   WS    → ws://localhost:${PORT}`);
    console.log(`   Health → http://localhost:${PORT}/health\n`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully…`);
    httpServer.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
    // Force exit after 5 s if connections are still open
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
