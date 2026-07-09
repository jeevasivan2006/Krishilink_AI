/**
 * server.js — KrishiLink API Entry Point
 * ─────────────────────────────────────────────────────────────────
 * • ONLY file that calls server.listen()
 * • Auto-finds next available port on EADDRINUSE
 * • server.listen() errors are caught via the 'error' event (not try/catch)
 */

import net from 'net';
import http from 'http';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import logger from './config/logger.js';

/* ── Port helpers ────────────────────────────────────────────────── */

/**
 * Check whether a TCP port is free on localhost.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => tester.close(() => resolve(true)));
    tester.listen(port, '0.0.0.0');
  });
}

/**
 * Find the first free port starting from `start` (checks up to 10 ports).
 * @param {number} start
 * @returns {Promise<number>}
 */
async function findAvailablePort(start) {
  for (let port = start; port <= start + 10; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No available port found in range ${start}–${start + 10}.`);
}

/**
 * Start an http.Server on the given port.
 * Properly handles the asynchronous 'error' event emitted by net.Server.
 * @param {http.Server} server
 * @param {number} port
 * @returns {Promise<void>}
 */
function listenAsync(server, port) {
  return new Promise((resolve, reject) => {
    // Must attach 'error' BEFORE calling .listen()
    server.once('error', reject);
    server.listen(port, () => {
      server.removeListener('error', reject); // clean up on success
      resolve();
    });
  });
}

/* ── Startup ─────────────────────────────────────────────────────── */

async function start() {
  /* 1. Environment */
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('  KrishiLink API — Starting Up');
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info(`✓ Environment   : ${process.env.NODE_ENV || 'development'}`);
  logger.info('✓ Environment variables loaded');

  /* 2. Database */
  logger.info('✓ Supabase PostgreSQL configuration loaded');
  await connectDatabase();
  logger.info('✓ Database connected');

  /* 3. Resolve port — pre-check then handle EADDRINUSE at listen time */
  const desiredPort = parseInt(process.env.PORT, 10) || 3000;
  const server = http.createServer(app);

  let PORT = desiredPort;

  try {
    await listenAsync(server, PORT);
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`⚠️  Port ${PORT} is already in use. Finding next available port…`);
      PORT = await findAvailablePort(desiredPort + 1);
      logger.warn(`⚠️  Switching to port ${PORT}. Set PORT=${PORT} in .env to make permanent.`);
      await listenAsync(server, PORT);
    } else {
      throw err; // re-throw non-port errors
    }
  }

  /* 4. Ready */
  logger.info(`✓ Server listening on PORT ${PORT}`);
  logger.info(`✓ API Base URL  : http://localhost:${PORT}/api/v1`);
  logger.info(`✓ Swagger Docs  : http://localhost:${PORT}/api-docs`);
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  /* 5. Graceful shutdown */
  const shutdown = (signal) => {
    logger.info(`\n🛑 Received ${signal}. Shutting down gracefully…`);
    server.close(() => {
      logger.info('✓ HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('❌ Forced shutdown after 10 s timeout');
      process.exit(1);
    }, 10_000);
  };

  process.once('SIGINT',  () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

/* ── Boot ────────────────────────────────────────────────────────── */

start().catch((err) => {
  logger.error('❌ Failed to start server');
  logger.error(err.message || err);
  process.exit(1);
});
