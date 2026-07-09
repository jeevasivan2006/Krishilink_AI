import { Pool } from 'pg';
import dotenv from 'dotenv';
import process from 'process';
import logger from './logger.js';

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  logger.warn('⚠️  .env file not found or failed to load. Ensure variables are injected by the environment.');
} else {
  logger.info('✓ dotenv loaded');
}

/**
 * Validate required environment variables.
 * Throws an error during startup if any variable is missing.
 */
const requiredEnv = ['DATABASE_URL'];
for (const varName of requiredEnv) {
  if (!process.env[varName]) {
    logger.error(`❌ Missing environment variable: ${varName}`);
    throw new Error(`Environment variable ${varName} is required but not set.`);
  }
}
logger.info('✓ DATABASE_URL found');

/**
 * Internal pool instance. It is lazily created on first `connectDatabase` call.
 * Using a singleton ensures the same pool is reused across the app.
 */
let _pool = null;

/**
 * Create a new Pool instance.
 * Centralised configuration makes it easy to adjust pool settings.
 */
function createPool() {
  const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    // Production‑grade defaults – you can tune these as needed
    max: Number(process.env.PG_POOL_MAX) || 20,
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT) || 2000,
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
  });
}

/**
 * Connect to the database (initialises the pool if not already).
 * Performs a lightweight test query to ensure connectivity.
 */
export async function connectDatabase() {
  if (_pool) return _pool; // already connected
  _pool = createPool();

  // Global error handling – log unexpected errors on idle clients
  _pool.on('error', err => {
    logger.error('Unexpected error on idle PostgreSQL client', err);
    // In production you may want to trigger alerts/restarts here.
  });

  try {
    logger.info('✓ Connecting to Supabase...');
    // Simple test query – throws if connection fails
    await _pool.query('SELECT 1');
    logger.info('✓ Connected');
  } catch (err) {
    logger.error('❌ Unable to establish PostgreSQL connection pool');
    console.error(err);
    // Propagate so the application can exit or retry as needed
    throw err;
  }

  // Graceful shutdown – end pool on process termination signals
  const gracefulShutdown = async () => {
    await closeDatabase();
    process.exit(0);
  };
  process.once('SIGINT', gracefulShutdown);
  process.once('SIGTERM', gracefulShutdown);

  return _pool;
}

/**
 * Close the pool and release all resources.
 */
export async function closeDatabase() {
  if (!_pool) return;
  try {
    await _pool.end();
    logger.info('🛑 PostgreSQL pool has been closed');
  } catch (err) {
    logger.error('Error while closing PostgreSQL pool', err);
  } finally {
    _pool = null;
  }
}

/**
 * Health‑check helper – runs a lightweight query.
 * Returns a boolean indicating DB availability.
 */
export async function healthCheck() {
  if (!_pool) {
    // If pool not yet created, attempt a temporary connection for the check
    const tempPool = createPool();
    try {
      await tempPool.query('SELECT 1');
      await tempPool.end();
      return true;
    } catch (err) {
      logger.error('Health‑check query failed', err);
      await tempPool.end();
      return false;
    }
  }
  try {
    await _pool.query('SELECT 1');
    return true;
  } catch (err) {
    logger.error('Health‑check query failed', err);
    return false;
  }
}

/**
 * Export the singleton pool for direct queries when needed.
 * Consumers should still prefer `connectDatabase()` to guarantee init.
 */
export default {
  get pool() {
    if (!_pool) {
      // Lazy initialise – useful for modules that import this file directly
      _pool = createPool();
    }
    return _pool;
  },
  connectDatabase,
  closeDatabase,
  healthCheck,
};
