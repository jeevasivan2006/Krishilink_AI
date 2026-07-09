import createError from 'http-errors';
import { withTransaction } from '../../database/transaction.js';
import { query } from '../../database/index.js';
import {
  TRACKABLE_BOOKING_STATUSES,
  TRACKING_STATUS,
} from '../constants/trackingStatus.js';
import { computeLiveEta, buildRouteFromInput } from '../lib/routeHelper.js';

function mapLocation(row) {
  if (!row) return null;
  return {
    driverId: row.driver_id,
    bookingId: row.booking_id,
    lat: Number(row.lat),
    lng: Number(row.lng),
    heading: row.heading != null ? Number(row.heading) : null,
    speedKmh: row.speed_kmh != null ? Number(row.speed_kmh) : null,
    accuracyM: row.accuracy_m != null ? Number(row.accuracy_m) : null,
    recordedAt: row.recorded_at,
    updatedAt: row.updated_at,
  };
}

function mapRoute(row) {
  if (!row) return null;
  return {
    id: row.id,
    bookingId: row.booking_id,
    origin: { lat: Number(row.origin_lat), lng: Number(row.origin_lng) },
    destination: { lat: Number(row.destination_lat), lng: Number(row.destination_lng) },
    waypoints: row.waypoints ?? [],
    plannedDistanceKm: row.planned_distance_km != null ? Number(row.planned_distance_km) : null,
    plannedDurationMinutes: row.planned_duration_minutes,
    encodedPolyline: row.encoded_polyline,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTracking(row) {
  if (!row) return null;
  return {
    bookingId: row.booking_id,
    driverId: row.driver_id,
    status: row.status,
    etaMinutes: row.eta_minutes,
    distanceRemainingKm: row.distance_remaining_km != null ? Number(row.distance_remaining_km) : null,
    lastCalculatedAt: row.last_calculated_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

async function getBooking(client, bookingId) {
  const exec = client ?? { query };
  const { rows } = await exec.query(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
  if (!rows[0]) throw createError(404, 'Booking not found');
  return rows[0];
}

async function assertBookingAccess(booking, userId, role) {
  if (role === 'driver' && booking.driver_id === userId) return;
  if (role === 'farmer' && booking.farmer_id === userId) return;
  if (!role || role === 'admin') return;
  if (booking.farmer_id === userId || booking.driver_id === userId) return;
  throw createError(403, 'Not authorized to access this booking tracking');
}

async function getRoute(client, bookingId) {
  const exec = client ?? { query };
  const { rows } = await exec.query(`SELECT * FROM booking_routes WHERE booking_id = $1`, [bookingId]);
  return rows[0] ?? null;
}

async function getTrackingSession(client, bookingId) {
  const exec = client ?? { query };
  const { rows } = await exec.query(`SELECT * FROM booking_tracking WHERE booking_id = $1`, [bookingId]);
  return rows[0] ?? null;
}

export async function updateDriverLocation(driverId, payload) {
  return withTransaction(async client => {
    const {
      lat,
      lng,
      heading,
      speed_kmh,
      accuracy_m,
      booking_id,
      recorded_at,
    } = payload;

    if (booking_id) {
      const booking = await getBooking(client, booking_id);
      if (booking.driver_id && booking.driver_id !== driverId) {
        throw createError(403, 'Booking is assigned to another driver');
      }
    }

    const recordedAt = recorded_at ?? new Date().toISOString();

    await client.query(
      `INSERT INTO driver_locations (driver_id, booking_id, lat, lng, heading, speed_kmh, accuracy_m, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (driver_id) DO UPDATE SET
         booking_id = EXCLUDED.booking_id,
         lat = EXCLUDED.lat,
         lng = EXCLUDED.lng,
         heading = EXCLUDED.heading,
         speed_kmh = EXCLUDED.speed_kmh,
         accuracy_m = EXCLUDED.accuracy_m,
         recorded_at = EXCLUDED.recorded_at`,
      [driverId, booking_id ?? null, lat, lng, heading ?? null, speed_kmh ?? null, accuracy_m ?? null, recordedAt],
    );

    await client.query(
      `INSERT INTO location_updates (driver_id, booking_id, lat, lng, heading, speed_kmh, accuracy_m, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [driverId, booking_id ?? null, lat, lng, heading ?? null, speed_kmh ?? null, accuracy_m ?? null, recordedAt],
    );

    let eta = null;
    if (booking_id) {
      const booking = await getBooking(client, booking_id);
      const route = await getRoute(client, booking_id);
      eta = computeLiveEta({
        currentLat: lat,
        currentLng: lng,
        speedKmh: speed_kmh,
        booking,
        route,
      });

      if (eta) {
        await client.query(
          `INSERT INTO booking_tracking (booking_id, driver_id, status, eta_minutes, distance_remaining_km, last_calculated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (booking_id) DO UPDATE SET
             driver_id = EXCLUDED.driver_id,
             eta_minutes = EXCLUDED.eta_minutes,
             distance_remaining_km = EXCLUDED.distance_remaining_km,
             last_calculated_at = NOW(),
             status = CASE
               WHEN booking_tracking.status = 'completed' THEN booking_tracking.status
               ELSE 'active'
             END`,
          [booking_id, driverId, TRACKING_STATUS.ACTIVE, eta.etaMinutes, eta.distanceRemainingKm],
        );
      }
    }

    const { rows } = await client.query(`SELECT * FROM driver_locations WHERE driver_id = $1`, [driverId]);

    return {
      location: mapLocation(rows[0]),
      eta,
    };
  });
}

export async function getDriverLocation(driverId) {
  const { rows } = await query(`SELECT * FROM driver_locations WHERE driver_id = $1`, [driverId]);
  if (!rows[0]) throw createError(404, 'Driver location not found');
  return mapLocation(rows[0]);
}

export async function startBookingTracking(bookingId, driverId) {
  return withTransaction(async client => {
    const booking = await getBooking(client, bookingId);

    if (booking.driver_id && booking.driver_id !== driverId) {
      throw createError(403, 'Booking is assigned to another driver');
    }
    if (!TRACKABLE_BOOKING_STATUSES.includes(booking.status)) {
      throw createError(409, `Booking status '${booking.status}' is not trackable`);
    }

    const { rows } = await client.query(
      `INSERT INTO booking_tracking (booking_id, driver_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (booking_id) DO UPDATE SET
         driver_id = EXCLUDED.driver_id,
         status = 'active',
         started_at = CASE WHEN booking_tracking.status = 'completed' THEN NOW() ELSE booking_tracking.started_at END,
         completed_at = NULL
       RETURNING *`,
      [bookingId, driverId, TRACKING_STATUS.ACTIVE],
    );

    if (!booking.driver_id) {
      await client.query(`UPDATE bookings SET driver_id = $1 WHERE id = $2`, [driverId, bookingId]);
    }

    return mapTracking(rows[0]);
  });
}

export async function storeBookingRoute(bookingId, userId, payload) {
  return withTransaction(async client => {
    const booking = await getBooking(client, bookingId);
    await assertBookingAccess(booking, userId, null);

    const routeData = buildRouteFromInput(payload);

    const { rows } = await client.query(
      `INSERT INTO booking_routes (
         booking_id, origin_lat, origin_lng, destination_lat, destination_lng,
         planned_distance_km, planned_duration_minutes, waypoints, encoded_polyline
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (booking_id) DO UPDATE SET
         origin_lat = EXCLUDED.origin_lat,
         origin_lng = EXCLUDED.origin_lng,
         destination_lat = EXCLUDED.destination_lat,
         destination_lng = EXCLUDED.destination_lng,
         planned_distance_km = EXCLUDED.planned_distance_km,
         planned_duration_minutes = EXCLUDED.planned_duration_minutes,
         waypoints = EXCLUDED.waypoints,
         encoded_polyline = EXCLUDED.encoded_polyline
       RETURNING *`,
      [
        bookingId,
        routeData.origin_lat,
        routeData.origin_lng,
        routeData.destination_lat,
        routeData.destination_lng,
        routeData.planned_distance_km,
        routeData.planned_duration_minutes,
        JSON.stringify(routeData.waypoints),
        payload.encoded_polyline ?? null,
      ],
    );

    return mapRoute(rows[0]);
  });
}

export async function getBookingRoute(bookingId, userId, role) {
  const booking = await getBooking(null, bookingId);
  await assertBookingAccess(booking, userId, role);

  const route = await getRoute(null, bookingId);
  if (!route) throw createError(404, 'Route not found for this booking');
  return mapRoute(route);
}

export async function getBookingEta(bookingId, userId, role) {
  const booking = await getBooking(null, bookingId);
  await assertBookingAccess(booking, userId, role);

  const route = await getRoute(null, bookingId);
  const tracking = await getTrackingSession(null, bookingId);

  let driverLocation = null;
  if (booking.driver_id) {
    const { rows } = await query(`SELECT * FROM driver_locations WHERE driver_id = $1`, [booking.driver_id]);
    driverLocation = rows[0] ?? null;
  }

  if (!driverLocation) {
    throw createError(404, 'No live driver location available for ETA calculation');
  }

  const eta = computeLiveEta({
    currentLat: driverLocation.lat,
    currentLng: driverLocation.lng,
    speedKmh: driverLocation.speed_kmh,
    booking,
    route,
  });

  if (!eta) {
    throw createError(422, 'Cannot calculate ETA — destination coordinates missing');
  }

  return {
    bookingId,
    driverId: booking.driver_id,
    tracking: tracking ? mapTracking(tracking) : null,
    currentLocation: mapLocation(driverLocation),
    ...eta,
  };
}

export async function getBookingTracking(bookingId, userId, role) {
  const booking = await getBooking(null, bookingId);
  await assertBookingAccess(booking, userId, role);

  const route = await getRoute(null, bookingId);
  const tracking = await getTrackingSession(null, bookingId);

  let driverLocation = null;
  if (booking.driver_id) {
    try {
      driverLocation = await getDriverLocation(booking.driver_id);
    } catch {
      driverLocation = null;
    }
  }

  let eta = null;
  if (driverLocation) {
    eta = computeLiveEta({
      currentLat: driverLocation.lat,
      currentLng: driverLocation.lng,
      speedKmh: driverLocation.speedKmh,
      booking,
      route,
    });
  }

  return {
    booking: {
      id: booking.id,
      status: booking.status,
      startLocation: booking.start_location,
      endLocation: booking.end_location,
      driverId: booking.driver_id,
      farmerId: booking.farmer_id,
      scheduledAt: booking.scheduled_at,
    },
    tracking: tracking ? mapTracking(tracking) : null,
    currentLocation: driverLocation,
    route: route ? mapRoute(route) : null,
    eta,
  };
}

export async function getLocationHistory(bookingId, userId, role, { page = 1, limit = 50 } = {}) {
  const booking = await getBooking(null, bookingId);
  await assertBookingAccess(booking, userId, role);

  const offset = (page - 1) * limit;

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM location_updates WHERE booking_id = $1`,
    [bookingId],
  );

  const { rows } = await query(
    `SELECT id, driver_id, booking_id, lat, lng, heading, speed_kmh, accuracy_m, recorded_at
     FROM location_updates
     WHERE booking_id = $1
     ORDER BY recorded_at ASC
     LIMIT $2 OFFSET $3`,
    [bookingId, limit, offset],
  );

  return {
    bookingId,
    points: rows.map(r => ({
      id: r.id,
      lat: Number(r.lat),
      lng: Number(r.lng),
      heading: r.heading != null ? Number(r.heading) : null,
      speedKmh: r.speed_kmh != null ? Number(r.speed_kmh) : null,
      accuracyM: r.accuracy_m != null ? Number(r.accuracy_m) : null,
      recordedAt: r.recorded_at,
    })),
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit) || 0,
    },
  };
}

export async function completeBookingTracking(bookingId, driverId) {
  return withTransaction(async client => {
    const booking = await getBooking(client, bookingId);
    if (booking.driver_id !== driverId) {
      throw createError(403, 'Not authorized to complete tracking for this booking');
    }

    const { rows } = await client.query(
      `UPDATE booking_tracking
       SET status = $1, completed_at = NOW(), eta_minutes = 0, distance_remaining_km = 0, last_calculated_at = NOW()
       WHERE booking_id = $2
       RETURNING *`,
      [TRACKING_STATUS.COMPLETED, bookingId],
    );

    if (!rows[0]) throw createError(404, 'Tracking session not found');
    return mapTracking(rows[0]);
  });
}
