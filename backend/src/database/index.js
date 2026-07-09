import db from '../config/database.js';

export const query = async (text, params) => {
  const pool = db.pool;
  return pool.query(text, params);
};
