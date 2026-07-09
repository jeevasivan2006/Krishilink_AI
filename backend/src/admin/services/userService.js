import createError from 'http-errors';
import { withTransaction } from '../../database/transaction.js';
import { query } from '../../database/index.js';
import { logAction } from './dashboardService.js';

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listUsers({ role, status, search, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (role) {
    conditions.push(`role = $${idx++}`);
    params.push(role);
  }
  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }
  if (search) {
    conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx} OR phone ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM users ${where}`, params);
  const { rows } = await query(
    `SELECT id, name, email, phone, role, status, created_at, updated_at
     FROM users ${where}
     ORDER BY created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset],
  );

  return {
    users: rows.map(mapUser),
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit) || 0,
    },
  };
}

export async function getUserById(userId) {
  const { rows } = await query(
    `SELECT id, name, email, phone, role, status, created_at, updated_at FROM users WHERE id = $1`,
    [userId],
  );
  if (!rows[0]) throw createError(404, 'User not found');
  return mapUser(rows[0]);
}

export async function createUser(adminId, payload) {
  return withTransaction(async client => {
    const { name, email, phone, role, status } = payload;

    const { rows } = await client.query(
      `INSERT INTO users (name, email, phone, role, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, phone ?? null, role, status ?? 'active'],
    );

    await logAction(adminId, 'user.created', 'user', rows[0].id, { email, role });
    return mapUser(rows[0]);
  });
}

export async function updateUser(adminId, userId, payload) {
  return withTransaction(async client => {
    const allowed = ['name', 'email', 'phone', 'role', 'status'];
    const updates = [];
    const values = [];
    let idx = 1;

    for (const field of allowed) {
      if (payload[field] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        values.push(payload[field]);
      }
    }

    if (!updates.length) throw createError(400, 'No valid fields to update');

    values.push(userId);
    const { rows } = await client.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    if (!rows[0]) throw createError(404, 'User not found');
    await logAction(adminId, 'user.updated', 'user', userId, payload);
    return mapUser(rows[0]);
  });
}

export async function deleteUser(adminId, userId) {
  return withTransaction(async client => {
    const { rows } = await client.query(`DELETE FROM users WHERE id = $1 RETURNING id, email`, [userId]);
    if (!rows[0]) throw createError(404, 'User not found');
    await logAction(adminId, 'user.deleted', 'user', userId, { email: rows[0].email });
    return { deleted: true, userId };
  });
}
