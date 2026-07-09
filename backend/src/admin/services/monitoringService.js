import createError from 'http-errors';
import { query } from '../../database/index.js';

const ACTIVE_STATUSES = ['accepted', 'pickup_started', 'in_transit'];
const ATTENTION_STATUSES = ['pending', 'searching_truck', 'shared_matching'];

export async function getBookingMonitoring({ status, page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (status) {
    conditions.push(`b.status = $${idx++}`);
    params.push(status);
  } else {
    conditions.push(`b.status NOT IN ('delivered', 'cancelled')`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM bookings b ${where}`, params);

  const { rows } = await query(
    `SELECT b.*, f.name AS farmer_name, d.name AS driver_name,
            bt.eta_minutes, bt.distance_remaining_km, bt.last_calculated_at,
            dl.lat AS driver_lat, dl.lng AS driver_lng, dl.recorded_at AS location_updated_at
     FROM bookings b
     LEFT JOIN users f ON f.id = b.farmer_id
     LEFT JOIN users d ON d.id = b.driver_id
     LEFT JOIN booking_tracking bt ON bt.booking_id = b.id
     LEFT JOIN driver_locations dl ON dl.driver_id = b.driver_id
     ${where}
     ORDER BY
       CASE b.status
         WHEN 'in_transit' THEN 1
         WHEN 'pickup_started' THEN 2
         WHEN 'accepted' THEN 3
         ELSE 4
       END,
       b.scheduled_at ASC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset],
  );

  return {
    bookings: rows.map(mapMonitoringBooking),
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit) || 0,
    },
  };
}

export async function getBookingMonitoringDetail(bookingId) {
  const { rows } = await query(
    `SELECT b.*, f.name AS farmer_name, f.phone AS farmer_phone,
            d.name AS driver_name, d.phone AS driver_phone,
            bt.status AS tracking_status, bt.eta_minutes, bt.distance_remaining_km,
            bt.last_calculated_at, bt.started_at AS tracking_started_at,
            dl.lat AS driver_lat, dl.lng AS driver_lng, dl.speed_kmh, dl.recorded_at AS location_updated_at,
            br.planned_distance_km, br.planned_duration_minutes
     FROM bookings b
     LEFT JOIN users f ON f.id = b.farmer_id
     LEFT JOIN users d ON d.id = b.driver_id
     LEFT JOIN booking_tracking bt ON bt.booking_id = b.id
     LEFT JOIN driver_locations dl ON dl.driver_id = b.driver_id
     LEFT JOIN booking_routes br ON br.booking_id = b.id
     WHERE b.id = $1`,
    [bookingId],
  );

  if (!rows[0]) throw createError(404, 'Booking not found');

  const [timeline, recentLocations] = await Promise.all([
    query(
      `SELECT from_status, to_status, note, actor_id, created_at
       FROM booking_timeline WHERE booking_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [bookingId],
    ),
    query(
      `SELECT lat, lng, speed_kmh, recorded_at
       FROM location_updates WHERE booking_id = $1
       ORDER BY recorded_at DESC LIMIT 10`,
      [bookingId],
    ),
  ]);

  return {
    ...mapMonitoringBooking(rows[0]),
    farmerPhone: rows[0].farmer_phone,
    driverPhone: rows[0].driver_phone,
    tracking: {
      status: rows[0].tracking_status,
      etaMinutes: rows[0].eta_minutes,
      distanceRemainingKm: rows[0].distance_remaining_km != null ? Number(rows[0].distance_remaining_km) : null,
      lastCalculatedAt: rows[0].last_calculated_at,
      startedAt: rows[0].tracking_started_at,
      plannedDistanceKm: rows[0].planned_distance_km != null ? Number(rows[0].planned_distance_km) : null,
      plannedDurationMinutes: rows[0].planned_duration_minutes,
    },
    timeline: timeline.rows,
    recentLocations: recentLocations.rows.map(r => ({
      lat: Number(r.lat),
      lng: Number(r.lng),
      speedKmh: r.speed_kmh != null ? Number(r.speed_kmh) : null,
      recordedAt: r.recorded_at,
    })),
  };
}

export async function getActiveTrips() {
  const { rows } = await query(
    `SELECT b.id, b.status, b.start_location, b.end_location, b.scheduled_at,
            d.name AS driver_name, f.name AS farmer_name,
            bt.eta_minutes, bt.distance_remaining_km,
            dl.lat, dl.lng, dl.recorded_at
     FROM bookings b
     LEFT JOIN users d ON d.id = b.driver_id
     LEFT JOIN users f ON f.id = b.farmer_id
     LEFT JOIN booking_tracking bt ON bt.booking_id = b.id
     LEFT JOIN driver_locations dl ON dl.driver_id = b.driver_id
     WHERE b.status = ANY($1::varchar[])
     ORDER BY b.scheduled_at ASC`,
    [ACTIVE_STATUSES],
  );

  return {
    count: rows.length,
    trips: rows.map(r => ({
      bookingId: r.id,
      status: r.status,
      pickup: r.start_location,
      destination: r.end_location,
      scheduledAt: r.scheduled_at,
      driver: r.driver_name,
      farmer: r.farmer_name,
      etaMinutes: r.eta_minutes,
      distanceRemainingKm: r.distance_remaining_km != null ? Number(r.distance_remaining_km) : null,
      driverLocation: r.lat != null ? { lat: Number(r.lat), lng: Number(r.lng), recordedAt: r.recorded_at } : null,
    })),
  };
}

export async function getAttentionRequired() {
  const { rows } = await query(
    `SELECT id, status, start_location, end_location, scheduled_at, created_at, farmer_id
     FROM bookings
     WHERE status = ANY($1::varchar[])
       AND scheduled_at < NOW() + INTERVAL '24 hours'
     ORDER BY scheduled_at ASC
     LIMIT 50`,
    [ATTENTION_STATUSES],
  );

  const stale = await query(
    `SELECT b.id, b.status, b.start_location, b.scheduled_at
     FROM bookings b
     WHERE b.status IN ('accepted', 'pickup_started')
       AND b.scheduled_at < NOW() - INTERVAL '2 hours'
     LIMIT 20`,
  );

  return {
    upcomingUnassigned: rows.length,
    staleTrips: stale.rows.length,
    bookings: rows,
    staleBookings: stale.rows,
  };
}

function mapMonitoringBooking(row) {
  return {
    id: row.id,
    status: row.status,
    farmerId: row.farmer_id,
    driverId: row.driver_id,
    farmerName: row.farmer_name,
    driverName: row.driver_name,
    startLocation: row.start_location,
    endLocation: row.end_location,
    scheduledAt: row.scheduled_at,
    estimatedCost: row.estimated_cost != null ? Number(row.estimated_cost) : null,
    createdAt: row.created_at,
    etaMinutes: row.eta_minutes,
    distanceRemainingKm: row.distance_remaining_km != null ? Number(row.distance_remaining_km) : null,
    lastCalculatedAt: row.last_calculated_at,
    driverLocation: row.driver_lat != null
      ? { lat: Number(row.driver_lat), lng: Number(row.driver_lng), recordedAt: row.location_updated_at }
      : null,
  };
}
