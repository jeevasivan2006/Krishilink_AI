import createError from 'http-errors';
import { withTransaction } from '../../database/transaction.js';
import { query } from '../../database/index.js';
import { assertTransitionAllowed, isValidStatus } from '../../booking/constants/bookingStatus.js';
import { logAction } from './dashboardService.js';

function mapBooking(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmerId: row.farmer_id,
    driverId: row.driver_id,
    vehicleId: row.vehicle_id,
    startLocation: row.start_location,
    endLocation: row.end_location,
    scheduledAt: row.scheduled_at,
    status: row.status,
    estimatedCost: row.estimated_cost != null ? Number(row.estimated_cost) : null,
    finalCost: row.final_cost != null ? Number(row.final_cost) : null,
    cargoWeightKg: row.cargo_weight_kg != null ? Number(row.cargo_weight_kg) : null,
    wantsShared: row.wants_shared,
    sharedGroupId: row.shared_group_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    farmerName: row.farmer_name,
    driverName: row.driver_name,
  };
}

export async function listBookings({ status, farmerId, driverId, search, dateFrom, dateTo, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (status) {
    conditions.push(`b.status = $${idx++}`);
    params.push(status);
  }
  if (farmerId) {
    conditions.push(`b.farmer_id = $${idx++}`);
    params.push(farmerId);
  }
  if (driverId) {
    conditions.push(`b.driver_id = $${idx++}`);
    params.push(driverId);
  }
  if (search) {
    conditions.push(`(b.start_location ILIKE $${idx} OR b.end_location ILIKE $${idx} OR b.id::text ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (dateFrom) {
    conditions.push(`b.scheduled_at >= $${idx++}`);
    params.push(dateFrom);
  }
  if (dateTo) {
    conditions.push(`b.scheduled_at <= $${idx++}`);
    params.push(dateTo);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM bookings b ${where}`, params);

  const { rows } = await query(
    `SELECT b.*, f.name AS farmer_name, d.name AS driver_name
     FROM bookings b
     LEFT JOIN users f ON f.id = b.farmer_id
     LEFT JOIN users d ON d.id = b.driver_id
     ${where}
     ORDER BY b.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset],
  );

  return {
    bookings: rows.map(mapBooking),
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit) || 0,
    },
  };
}

export async function getBookingById(bookingId) {
  const { rows } = await query(
    `SELECT b.*, f.name AS farmer_name, f.email AS farmer_email,
            d.name AS driver_name, d.phone AS driver_phone
     FROM bookings b
     LEFT JOIN users f ON f.id = b.farmer_id
     LEFT JOIN users d ON d.id = b.driver_id
     WHERE b.id = $1`,
    [bookingId],
  );
  if (!rows[0]) throw createError(404, 'Booking not found');

  const timeline = await query(
    `SELECT id, from_status, to_status, note, actor_id, created_at
     FROM booking_timeline WHERE booking_id = $1 ORDER BY created_at ASC`,
    [bookingId],
  );

  return {
    ...mapBooking(rows[0]),
    farmerEmail: rows[0].farmer_email,
    driverPhone: rows[0].driver_phone,
    timeline: timeline.rows,
  };
}

export async function updateBookingStatus(adminId, bookingId, { status, note }) {
  return withTransaction(async client => {
    const { rows } = await client.query(`SELECT status FROM bookings WHERE id = $1 FOR UPDATE`, [bookingId]);
    if (!rows[0]) throw createError(404, 'Booking not found');

    const currentStatus = rows[0].status;
    if (!isValidStatus(status)) throw createError(422, `Invalid status: ${status}`);
    assertTransitionAllowed(currentStatus, status);

    await client.query(`UPDATE bookings SET status = $1 WHERE id = $2`, [status, bookingId]);
    await client.query(
      `INSERT INTO booking_timeline (booking_id, from_status, to_status, note, actor_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [bookingId, currentStatus, status, note ?? 'Admin status update', adminId],
    );

    await logAction(adminId, 'booking.status_updated', 'booking', bookingId, { from: currentStatus, to: status });
    return getBookingById(bookingId);
  });
}
