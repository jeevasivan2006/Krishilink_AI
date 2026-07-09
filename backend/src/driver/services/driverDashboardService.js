import createError from 'http-errors';
import { query } from '../../database/index.js';
import { BOOKING_STATUS } from '../../booking/constants/bookingStatus.js';
import * as bookingService from '../../booking/services/bookingService.js';

const ACTIVE_STATUSES = [
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.PICKUP_STARTED,
  BOOKING_STATUS.IN_TRANSIT,
];

const AVAILABLE_STATUSES = [
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.SEARCHING_TRUCK,
  BOOKING_STATUS.SHARED_MATCHING,
];

function numberOrNull(value) {
  return value != null ? Number(value) : null;
}

function mapBooking(row) {
  if (!row) return null;
  return {
    id: row.id,
    farmerId: row.farmer_id,
    farmerName: row.farmer_name,
    farmerPhone: row.farmer_phone,
    vehicleId: row.vehicle_id,
    driverId: row.driver_id,
    startLocation: row.start_location,
    endLocation: row.end_location,
    scheduledAt: row.scheduled_at,
    status: row.status,
    estimatedCost: numberOrNull(row.estimated_cost),
    finalCost: numberOrNull(row.final_cost),
    cargoWeightKg: numberOrNull(row.cargo_weight_kg),
    wantsShared: row.wants_shared ?? false,
    sharedGroupId: row.shared_group_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSharedRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    truckId: row.truck_id,
    startLocation: row.start_location,
    endLocation: row.end_location,
    scheduledDate: row.scheduled_date,
    totalCapacityKg: numberOrNull(row.total_capacity_kg),
    usedCapacityKg: numberOrNull(row.used_capacity_kg),
    totalCost: numberOrNull(row.total_cost),
    status: row.status,
    memberCount: Number(row.member_count ?? 0),
    createdAt: row.created_at,
  };
}

function mapReturnTrip(row) {
  if (!row) return null;
  return {
    id: row.id,
    suggestionId: row.suggestion_id,
    bookingId: row.booking_id,
    farmerId: row.farmer_id,
    farmerName: row.farmer_name,
    startLocation: row.start_location,
    endLocation: row.end_location,
    pickupDistanceKm: numberOrNull(row.pickup_distance_km),
    tripDistanceKm: numberOrNull(row.trip_distance_km),
    matchScore: numberOrNull(row.match_score),
    status: row.status,
    acceptedAt: row.accepted_at,
    suggestedAt: row.suggested_at,
  };
}

function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    status: row.status,
    licenseNumber: row.license_number,
    vehicleType: row.vehicle_type,
    vehicleNumber: row.vehicle_number,
    rating: numberOrNull(row.rating),
    totalTrips: Number(row.total_trips ?? 0),
    availability: row.availability ?? 'offline',
  };
}

async function ensureDriverResponsesTable() {
  await query(
    `CREATE TABLE IF NOT EXISTS driver_booking_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      driver_id UUID NOT NULL,
      response VARCHAR(20) NOT NULL,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (booking_id, driver_id),
      CONSTRAINT driver_booking_responses_response_check
        CHECK (response IN ('accepted', 'rejected'))
    )`,
  );
}

async function getProfile(driverId) {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.status,
            dp.license_number, dp.vehicle_type, dp.vehicle_number,
            dp.rating, dp.total_trips, dp.availability
     FROM users u
     LEFT JOIN driver_profiles dp ON dp.user_id = u.id
     WHERE u.id = $1 AND u.role IN ('driver', 'lorry_owner')`,
    [driverId],
  );
  return mapProfile(rows[0]);
}

async function listActiveTrips(driverId, limit = 8) {
  const { rows } = await query(
    `SELECT b.*, f.name AS farmer_name, f.phone AS farmer_phone
     FROM bookings b
     LEFT JOIN users f ON f.id = b.farmer_id
     WHERE b.driver_id = $1 AND b.status = ANY($2)
     ORDER BY b.scheduled_at ASC
     LIMIT $3`,
    [driverId, ACTIVE_STATUSES, limit],
  );
  return rows.map(mapBooking);
}

async function listTodaysTrips(driverId, limit = 8) {
  const { rows } = await query(
    `SELECT b.*, f.name AS farmer_name, f.phone AS farmer_phone
     FROM bookings b
     LEFT JOIN users f ON f.id = b.farmer_id
     WHERE b.driver_id = $1
       AND b.status <> $2
       AND b.scheduled_at >= date_trunc('day', NOW())
       AND b.scheduled_at < date_trunc('day', NOW()) + INTERVAL '1 day'
     ORDER BY b.scheduled_at ASC
     LIMIT $3`,
    [driverId, BOOKING_STATUS.CANCELLED, limit],
  );
  return rows.map(mapBooking);
}

async function listAvailableRequests(driverId, limit = 8) {
  const { rows } = await query(
    `SELECT b.*, f.name AS farmer_name, f.phone AS farmer_phone
     FROM bookings b
     LEFT JOIN users f ON f.id = b.farmer_id
     LEFT JOIN driver_booking_responses dbr
       ON dbr.booking_id = b.id AND dbr.driver_id = $1
     WHERE b.driver_id IS NULL
       AND b.status = ANY($2)
       AND dbr.id IS NULL
     ORDER BY b.scheduled_at ASC
     LIMIT $3`,
    [driverId, AVAILABLE_STATUSES, limit],
  );
  return rows.map(mapBooking);
}

async function listSharedRequests(limit = 6) {
  const { rows } = await query(
    `SELECT sg.*,
            COUNT(sgm.id)::int AS member_count
     FROM shared_groups sg
     LEFT JOIN shared_group_members sgm
       ON sgm.shared_group_id = sg.id AND sgm.status = 'active'
     WHERE sg.status IN ('open', 'confirmed')
     GROUP BY sg.id
     ORDER BY sg.scheduled_date ASC, sg.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map(mapSharedRequest);
}

async function listReturnTrips(driverId, limit = 6) {
  const { rows } = await query(
    `SELECT rt.id, rt.suggestion_id, rt.booking_id, rt.farmer_id,
            rt.pickup_distance_km, rt.trip_distance_km, rt.status,
            rt.accepted_at, rts.suggested_at, rts.match_score,
            b.start_location, b.end_location,
            f.name AS farmer_name
     FROM return_trips rt
     LEFT JOIN return_trip_suggestions rts ON rts.id = rt.suggestion_id
     LEFT JOIN bookings b ON b.id = rt.booking_id
     LEFT JOIN users f ON f.id = rt.farmer_id
     WHERE rt.driver_id = $1
     ORDER BY rt.accepted_at DESC
     LIMIT $2`,
    [driverId, limit],
  );
  return rows.map(mapReturnTrip);
}

async function getEarnings(driverId) {
  const { rows } = await query(
    `SELECT
       COALESCE(SUM(COALESCE(final_cost, estimated_cost, 0)), 0)::numeric AS total_earnings,
       COALESCE(SUM(COALESCE(final_cost, estimated_cost, 0)) FILTER (
         WHERE scheduled_at >= date_trunc('month', NOW())
       ), 0)::numeric AS month_earnings,
       COUNT(*) FILTER (WHERE status = $2)::int AS completed_trips
     FROM bookings
     WHERE driver_id = $1`,
    [driverId, BOOKING_STATUS.DELIVERED],
  );

  return {
    total: Number(rows[0]?.total_earnings ?? 0),
    thisMonth: Number(rows[0]?.month_earnings ?? 0),
    completedTrips: Number(rows[0]?.completed_trips ?? 0),
  };
}

export async function getDashboard(driverId) {
  await ensureDriverResponsesTable();

  const [
    profile,
    todaysTrips,
    activeTrips,
    availableRequests,
    sharedRequests,
    returnTrips,
    earnings,
  ] = await Promise.all([
    getProfile(driverId),
    listTodaysTrips(driverId),
    listActiveTrips(driverId),
    listAvailableRequests(driverId),
    listSharedRequests(),
    listReturnTrips(driverId),
    getEarnings(driverId),
  ]);

  if (!profile) {
    throw createError(404, 'Driver profile not found');
  }

  return {
    profile,
    vehicle: {
      type: profile.vehicleType,
      number: profile.vehicleNumber,
      availability: profile.availability,
      licenseNumber: profile.licenseNumber,
    },
    earnings,
    todaysTrips,
    activeTrips,
    availableRequests,
    sharedRequests,
    returnTrips,
    stats: {
      todaysTrips: todaysTrips.length,
      activeTrips: activeTrips.length,
      availableRequests: availableRequests.length,
      sharedRequests: sharedRequests.length,
      returnTrips: returnTrips.length,
    },
  };
}

export async function acceptBooking(driverId, bookingId) {
  await ensureDriverResponsesTable();

  const { rows } = await query(
    `SELECT id, status, driver_id FROM bookings WHERE id = $1`,
    [bookingId],
  );
  const booking = rows[0];
  if (!booking) throw createError(404, 'Booking not found');
  if (booking.driver_id && booking.driver_id !== driverId) {
    throw createError(409, 'Booking is already assigned to another driver');
  }
  if (!AVAILABLE_STATUSES.includes(booking.status)) {
    throw createError(409, `Booking cannot be accepted from '${booking.status}' status`);
  }

  const accepted = await bookingService.updateBookingStatus(bookingId, BOOKING_STATUS.ACCEPTED, {
    actorId: driverId,
    driverId,
    note: 'Booking accepted by driver',
  });

  await query(
    `INSERT INTO driver_booking_responses (booking_id, driver_id, response)
     VALUES ($1, $2, 'accepted')
     ON CONFLICT (booking_id, driver_id)
     DO UPDATE SET response = 'accepted', reason = NULL, created_at = NOW()`,
    [bookingId, driverId],
  );

  return accepted;
}

export async function rejectBooking(driverId, bookingId, { reason } = {}) {
  await ensureDriverResponsesTable();

  const { rows } = await query(`SELECT id FROM bookings WHERE id = $1`, [bookingId]);
  if (!rows[0]) throw createError(404, 'Booking not found');

  await query(
    `INSERT INTO driver_booking_responses (booking_id, driver_id, response, reason)
     VALUES ($1, $2, 'rejected', $3)
     ON CONFLICT (booking_id, driver_id)
     DO UPDATE SET response = 'rejected', reason = EXCLUDED.reason, created_at = NOW()`,
    [bookingId, driverId, reason ?? null],
  );

  return { bookingId, response: 'rejected' };
}

export async function updateAvailability(driverId, availability) {
  const allowed = ['available', 'busy', 'offline'];
  if (!allowed.includes(availability)) {
    throw createError(400, `Invalid availability: '${availability}'`);
  }
  const { rows } = await query(
    `UPDATE driver_profiles 
     SET availability = $1 
     WHERE user_id = $2 
     RETURNING availability`,
    [availability, driverId]
  );
  if (!rows[0]) throw createError(404, 'Driver profile not found');
  return rows[0];
}
