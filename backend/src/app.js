/**
 * @module app
 * Express application factory.
 * Kept separate from the HTTP server so it can be imported in tests.
 */

import express from 'express';
import cors from 'cors';

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4173'];

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: ALLOWED_ORIGINS,
      methods: ['GET'],
    }),
  );

  app.use(express.json());

  // Health-check — useful for container orchestration probes
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Generic 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('[App] Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
