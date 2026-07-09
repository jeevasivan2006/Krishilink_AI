import createError from 'http-errors';
import { withTransaction } from '../../database/transaction.js';
import { query } from '../../database/index.js';
import {
  BOOKING_STATUS,
  assertTransitionAllowed,
  isTerminalStatus,
} from '../constants/bookingStatus.js';

const BOOKING_COLUMNS = `
  id, farmer_id, vehicle_id, driver_id,
  start_location, end_location,
  start_lat, start_lng, end_lat, end_lng,
  scheduled_at, status, estimated_cost, final_cost, notes,
  cargo_weight_kg, shared_group_id, wants_shared,
  created_at, updated_at
`;

function mapBooking(row) {
  if (!row) return null;
  return {
    ...row,
    estimated_cost: row.estimated_cost != null ? Number(row.estimated_cost) : null,
    final_cost: row.final_cost != null ? Number(row.final_cost) : null,
    cargo_weight_kg: row.cargo_weight_kg != null ? Number(row.cargo_weight_kg) : null,
    wants_shared: row.wants_shared ?? false,
    start_lat: row.start_lat != null ? Number(row.start_lat) : null,
    start_lng: row.start_lng != null ? Number(row.start_lng) : null,
    end_lat: row.end_lat != null ? Number(row.end_lat) : null,
    end_lng: row.end_lng != null ? Number(row.end_lng) : null,
  };
}

async function insertTimelineEntry(client, { bookingId, fromStatus, toStatus, note, actorId, metadata }) {
  const sql = `
    INSERT INTO booking_timeline (booking_id, from_status, to_status, note, actor_id, metadata)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const { rows } = await client.query(sql, [
    bookingId,
    fromStatus,
    toStatus,
    note ?? null,
    actorId ?? null,
    JSON.stringify(metadata ?? {}),
  ]);
  return rows[0];
}

export async function createBooking(farmerId, payload) {
  return withTransaction(async client => {
    const {
      start_location,
      end_location,
      scheduled_at,
      vehicle_id,
      estimated_cost,
      notes,
      start_lat,
      start_lng,
      end_lat,
      end_lng,
      cargo_weight_kg,
      wants_shared,
    } = payload;

    const insertSql = `
      INSERT INTO bookings (
        farmer_id, vehicle_id, start_location, end_location,
        start_lat, start_lng, end_lat, end_lng,
        scheduled_at, status, estimated_cost, notes,
        cargo_weight_kg, wants_shared
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING ${BOOKING_COLUMNS}
    `;

    const { rows } = await client.query(insertSql, [
      farmerId,
      vehicle_id ?? null,
      start_location,
      end_location,
      start_lat ?? null,
      start_lng ?? null,
      end_lat ?? null,
      end_lng ?? null,
      scheduled_at,
      BOOKING_STATUS.PENDING,
      estimated_cost ?? null,
      notes ?? null,
      cargo_weight_kg ?? null,
      wants_shared ?? true,
    ]);

    const booking = rows[0];

    await insertTimelineEntry(client, {
      bookingId: booking.id,
      fromStatus: null,
      toStatus: BOOKING_STATUS.PENDING,
      note: 'Booking created',
      actorId: farmerId,
    });

    return mapBooking(booking);
  });
}

export async function listBookings({ farmerId, status, search, page, limit }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (farmerId) {
    conditions.push(`farmer_id = $${paramIndex++}`);
    params.push(farmerId);
  }
  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }
  if (search) {
    conditions.push(
      `(start_location ILIKE $${paramIndex} OR end_location ILIKE $${paramIndex} OR notes ILIKE $${paramIndex})`,
    );
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*)::int AS total FROM bookings ${whereClause}`;
  const countResult = await query(countSql, params);
  const total = countResult.rows[0].total;

  const listSql = `
    SELECT ${BOOKING_COLUMNS}
    FROM bookings
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `;

  const { rows } = await query(listSql, [...params, limit, offset]);

  return {
    bookings: rows.map(mapBooking),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
}

export async function getBookingById(bookingId, { farmerId } = {}) {
  const conditions = ['id = $1'];
  const params = [bookingId];

  if (farmerId) {
    conditions.push('farmer_id = $2');
    params.push(farmerId);
  }

  const sql = `SELECT ${BOOKING_COLUMNS} FROM bookings WHERE ${conditions.join(' AND ')}`;
  const { rows } = await query(sql, params);

  if (!rows[0]) {
    throw createError(404, 'Booking not found');
  }

  return mapBooking(rows[0]);
}

export async function updateBooking(bookingId, farmerId, payload) {
  return withTransaction(async client => {
    const { rows: locked } = await client.query(
      `SELECT id, status FROM bookings WHERE id = $1 AND farmer_id = $2 FOR UPDATE`,
      [bookingId, farmerId],
    );

    if (!locked[0]) {
      throw createError(404, 'Booking not found');
    }

    if (isTerminalStatus(locked[0].status)) {
      throw createError(409, `Cannot update booking in '${locked[0].status}' status`);
    }

    const allowedFields = [
      'start_location',
      'end_location',
      'start_lat',
      'start_lng',
      'end_lat',
      'end_lng',
      'scheduled_at',
      'vehicle_id',
      'estimated_cost',
      'notes',
    ];

    const updates = [];
    const values = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (payload[field] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        values.push(payload[field]);
      }
    }

    if (!updates.length) {
      throw createError(400, 'No valid fields provided for update');
    }

    values.push(bookingId, farmerId);

    const updateSql = `
      UPDATE bookings
      SET ${updates.join(', ')}
      WHERE id = $${idx++} AND farmer_id = $${idx}
      RETURNING ${BOOKING_COLUMNS}
    `;

    const { rows } = await client.query(updateSql, values);
    return mapBooking(rows[0]);
  });
}

export async function updateBookingStatus(bookingId, newStatus, { actorId, note, metadata, vehicleId, driverId, finalCost } = {}) {
  return withTransaction(async client => {
    const { rows } = await client.query(
      `SELECT id, status FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId],
    );

    if (!rows[0]) {
      throw createError(404, 'Booking not found');
    }

    const currentStatus = rows[0].status;
    assertTransitionAllowed(currentStatus, newStatus);

    const updateFields = ['status = $1'];
    const updateValues = [newStatus];
    let paramIndex = 2;

    if (vehicleId !== undefined) {
      updateFields.push(`vehicle_id = $${paramIndex++}`);
      updateValues.push(vehicleId);
    }
    if (driverId !== undefined) {
      updateFields.push(`driver_id = $${paramIndex++}`);
      updateValues.push(driverId);
    }
    if (finalCost !== undefined) {
      updateFields.push(`final_cost = $${paramIndex++}`);
      updateValues.push(finalCost);
    }

    updateValues.push(bookingId);

    await client.query(
      `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      updateValues,
    );

    await insertTimelineEntry(client, {
      bookingId,
      fromStatus: currentStatus,
      toStatus: newStatus,
      note,
      actorId,
      metadata,
    });

    const { rows: updated } = await client.query(
      `SELECT ${BOOKING_COLUMNS} FROM bookings WHERE id = $1`,
      [bookingId],
    );

    return mapBooking(updated[0]);
  });
}

export async function cancelBooking(bookingId, { farmerId, actorId, note } = {}) {
  const booking = await getBookingById(bookingId, farmerId ? { farmerId } : {});

  if (isTerminalStatus(booking.status)) {
    throw createError(409, `Booking is already '${booking.status}'`);
  }

  return updateBookingStatus(bookingId, BOOKING_STATUS.CANCELLED, {
    actorId: actorId ?? farmerId,
    note: note ?? 'Booking cancelled',
  });
}

export async function getBookingTimeline(bookingId, { farmerId } = {}) {
  if (farmerId) {
    await getBookingById(bookingId, { farmerId });
  } else {
    await getBookingById(bookingId);
  }

  const sql = `
    SELECT id, booking_id, from_status, to_status, note, actor_id, metadata, created_at
    FROM booking_timeline
    WHERE booking_id = $1
    ORDER BY created_at ASC
  `;

  const { rows } = await query(sql, [bookingId]);
  return rows;
}
