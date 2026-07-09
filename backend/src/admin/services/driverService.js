import createError from 'http-errors';
import { withTransaction } from '../../database/transaction.js';
import { query } from '../../database/index.js';
import { logAction } from './dashboardService.js';

function mapDriver(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    profile: {
      licenseNumber: row.license_number,
      vehicleType: row.vehicle_type,
      vehicleNumber: row.vehicle_number,
      rating: row.rating != null ? Number(row.rating) : 0,
      totalTrips: row.total_trips ?? 0,
      availability: row.availability ?? 'offline',
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listDrivers({ availability, status, search, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const conditions = [`u.role = 'driver'`];
  const params = [];
  let idx = 1;

  if (status) {
    conditions.push(`u.status = $${idx++}`);
    params.push(status);
  }
  if (availability) {
    conditions.push(`dp.availability = $${idx++}`);
    params.push(availability);
  }
  if (search) {
    conditions.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.phone ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM users u LEFT JOIN driver_profiles dp ON dp.user_id = u.id ${where}`,
    params,
  );

  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at, u.updated_at,
            dp.license_number, dp.vehicle_type, dp.vehicle_number,
            dp.rating, dp.total_trips, dp.availability
     FROM users u
     LEFT JOIN driver_profiles dp ON dp.user_id = u.id
     ${where}
     ORDER BY u.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset],
  );

  return {
    drivers: rows.map(mapDriver),
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit) || 0,
    },
  };
}

export async function getDriverById(driverId) {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at, u.updated_at,
            dp.license_number, dp.vehicle_type, dp.vehicle_number,
            dp.rating, dp.total_trips, dp.availability
     FROM users u
     LEFT JOIN driver_profiles dp ON dp.user_id = u.id
     WHERE u.id = $1 AND u.role = 'driver'`,
    [driverId],
  );
  if (!rows[0]) throw createError(404, 'Driver not found');

  const stats = await query(
    `SELECT
       COUNT(*)::int AS total_bookings,
       COUNT(*) FILTER (WHERE status = 'delivered')::int AS completed_trips
     FROM bookings WHERE driver_id = $1`,
    [driverId],
  );

  return {
    ...mapDriver(rows[0]),
    stats: {
      totalBookings: stats.rows[0].total_bookings,
      completedTrips: stats.rows[0].completed_trips,
    },
  };
}

export async function updateDriver(adminId, driverId, payload) {
  return withTransaction(async client => {
    const { rows: userRows } = await client.query(
      `SELECT id FROM users WHERE id = $1 AND role = 'driver'`,
      [driverId],
    );
    if (!userRows[0]) throw createError(404, 'Driver not found');

    if (payload.name || payload.phone || payload.status) {
      const userUpdates = [];
      const userValues = [];
      let idx = 1;
      for (const field of ['name', 'phone', 'status']) {
        if (payload[field] !== undefined) {
          userUpdates.push(`${field} = $${idx++}`);
          userValues.push(payload[field]);
        }
      }
      userValues.push(driverId);
      await client.query(
        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${idx}`,
        userValues,
      );
    }

    const profileFields = {
      license_number: payload.license_number,
      vehicle_type: payload.vehicle_type,
      vehicle_number: payload.vehicle_number,
      availability: payload.availability,
      rating: payload.rating,
    };

    const profileUpdates = Object.entries(profileFields).filter(([, v]) => v !== undefined);
    if (profileUpdates.length) {
      await client.query(
        `INSERT INTO driver_profiles (user_id)
         VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
        [driverId],
      );

      const sets = profileUpdates.map(([k], i) => `${k} = $${i + 2}`);
      await client.query(
        `UPDATE driver_profiles SET ${sets.join(', ')} WHERE user_id = $1`,
        [driverId, ...profileUpdates.map(([, v]) => v)],
      );
    }

    await logAction(adminId, 'driver.updated', 'driver', driverId, payload);
    return getDriverById(driverId);
  });
}
