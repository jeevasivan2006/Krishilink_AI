import db from '../config/database.js';

/**
 * Execute a callback inside a PostgreSQL transaction.
 * Rolls back on error; always releases the client.
 */
export async function withTransaction(callback) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
