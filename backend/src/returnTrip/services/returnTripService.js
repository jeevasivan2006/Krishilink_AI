import createError from 'http-errors';
import { withTransaction } from '../../database/transaction.js';
import { query } from '../../database/index.js';
import { BOOKING_STATUS } from '../../booking/constants/bookingStatus.js';
import {
  COMPLETION_STATUS,
  COMPLETION_TTL_HOURS,
  DEFAULT_SEARCH_RADIUS_KM,
  MATCHABLE_BOOKING_STATUSES,
  MAX_SUGGESTIONS,
  RETURN_TRIP_STATUS,
  SUGGESTION_STATUS,
  SUGGESTION_TTL_HOURS,
} from '../constants/returnTripStatus.js';
import { boundingBoxDelta, findNearbyBookings, haversineDistanceKm, roundKm } from '../lib/index.js';

const COMPLETION_COLUMNS = `
  id, driver_id, booking_id, vehicle_id,
  current_lat, current_lng, current_location,
  delivery_destination, delivery_lat, delivery_lng,
  return_destination, return_lat, return_lng,
  search_radius_km, status, available_until,
  completed_at, created_at, updated_at
`;

function mapCompletion(row) {
  if (!row) return null;
  return {
    ...row,
    current_lat: Number(row.current_lat),
    current_lng: Number(row.current_lng),
    delivery_lat: row.delivery_lat != null ? Number(row.delivery_lat) : null,
    delivery_lng: row.delivery_lng != null ? Number(row.delivery_lng) : null,
    return_lat: row.return_lat != null ? Number(row.return_lat) : null,
    return_lng: row.return_lng != null ? Number(row.return_lng) : null,
    search_radius_km: Number(row.search_radius_km),
  };
}

function mapSuggestion(row) {
  if (!row) return null;
  return {
    ...row,
    pickup_distance_km: Number(row.pickup_distance_km),
    return_alignment_km: row.return_alignment_km != null ? Number(row.return_alignment_km) : null,
    match_score: Number(row.match_score),
  };
}

function mapReturnTrip(row) {
  if (!row) return null;
  return {
    ...row,
    pickup_distance_km: Number(row.pickup_distance_km),
    trip_distance_km: row.trip_distance_km != null ? Number(row.trip_distance_km) : null,
  };
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

async function getCompletionById(client, completionId, driverId, { lock = false } = {}) {
  const conditions = ['id = $1'];
  const params = [completionId];

  if (driverId) {
    conditions.push('driver_id = $2');
    params.push(driverId);
  }

  const exec = client ?? { query };
  const lockClause = lock ? ' FOR UPDATE' : '';
  const { rows } = await exec.query(
    `SELECT ${COMPLETION_COLUMNS} FROM driver_delivery_completions WHERE ${conditions.join(' AND ')}${lockClause}`,
    params,
  );

  if (!rows[0]) throw createError(404, 'Delivery completion not found');
  return mapCompletion(rows[0]);
}

async function fetchCandidateBookings(client, completion) {
  const delta = boundingBoxDelta(completion.search_radius_km);
  const lat = completion.current_lat;
  const lng = completion.current_lng;

  const { rows } = await client.query(
    `SELECT
       id, farmer_id, start_location, end_location,
       start_lat, start_lng, end_lat, end_lng,
       scheduled_at, status, cargo_weight_kg, estimated_cost, driver_id
     FROM bookings
     WHERE status = ANY($1::varchar[])
       AND driver_id IS NULL
       AND start_lat IS NOT NULL
       AND start_lng IS NOT NULL
       AND start_lat BETWEEN $2 AND $3
       AND start_lng BETWEEN $4 AND $5
       AND id != $6
     ORDER BY scheduled_at ASC`,
    [
      MATCHABLE_BOOKING_STATUSES,
      lat - delta,
      lat + delta,
      lng - delta,
      lng + delta,
      completion.booking_id,
    ],
  );

  return rows;
}

async function expireStaleSuggestions(client, completionId) {
  await client.query(
    `UPDATE return_trip_suggestions
     SET status = $1, responded_at = NOW()
     WHERE delivery_completion_id = $2
       AND status = $3
       AND expires_at IS NOT NULL
       AND expires_at < NOW()`,
    [SUGGESTION_STATUS.EXPIRED, completionId, SUGGESTION_STATUS.SUGGESTED],
  );
}

export async function recordDeliveryCompletion(driverId, payload) {
  return withTransaction(async client => {
    const {
      booking_id,
      vehicle_id,
      current_lat,
      current_lng,
      current_location,
      delivery_destination,
      delivery_lat,
      delivery_lng,
      return_destination,
      return_lat,
      return_lng,
      search_radius_km,
    } = payload;

    const { rows: bookingRows } = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [booking_id],
    );
    const booking = bookingRows[0];

    if (!booking) throw createError(404, 'Booking not found');
    if (booking.driver_id && booking.driver_id !== driverId) {
      throw createError(403, 'Booking is assigned to another driver');
    }
    if (booking.status !== BOOKING_STATUS.DELIVERED) {
      throw createError(409, 'Booking must be in delivered status before recording completion');
    }

    const { rows: existing } = await client.query(
      `SELECT id FROM driver_delivery_completions WHERE booking_id = $1`,
      [booking_id],
    );
    if (existing[0]) {
      throw createError(409, 'Delivery completion already recorded for this booking');
    }

    const radius = search_radius_km ?? DEFAULT_SEARCH_RADIUS_KM;
    const availableUntil = hoursFromNow(COMPLETION_TTL_HOURS);

    const { rows } = await client.query(
      `INSERT INTO driver_delivery_completions (
         driver_id, booking_id, vehicle_id,
         current_lat, current_lng, current_location,
         delivery_destination, delivery_lat, delivery_lng,
         return_destination, return_lat, return_lng,
         search_radius_km, available_until
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING ${COMPLETION_COLUMNS}`,
      [
        driverId,
        booking_id,
        vehicle_id ?? booking.vehicle_id ?? null,
        current_lat,
        current_lng,
        current_location ?? booking.end_location,
        delivery_destination ?? booking.end_location,
        delivery_lat ?? booking.end_lat ?? current_lat,
        delivery_lng ?? booking.end_lng ?? current_lng,
        return_destination ?? null,
        return_lat ?? null,
        return_lng ?? null,
        radius,
        availableUntil,
      ],
    );

    const completion = mapCompletion(rows[0]);

    await client.query(
      `INSERT INTO booking_timeline (booking_id, from_status, to_status, note, actor_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        booking_id,
        BOOKING_STATUS.DELIVERED,
        BOOKING_STATUS.DELIVERED,
        'Driver available for return trip marketplace',
        driverId,
        JSON.stringify({ delivery_completion_id: completion.id }),
      ],
    );

    const suggestions = await generateSuggestionsInternal(client, completion.id, driverId);

    return { completion, suggestions };
  });
}

async function generateSuggestionsInternal(client, completionId, driverId) {
  const completion = await getCompletionById(client, completionId, driverId, { lock: true });

  if (completion.status !== COMPLETION_STATUS.AVAILABLE) {
    throw createError(409, `Completion is '${completion.status}' and cannot generate suggestions`);
  }

  await expireStaleSuggestions(client, completionId);

  const candidates = await fetchCandidateBookings(client, completion);
  const matches = findNearbyBookings(candidates, completion, { maxResults: MAX_SUGGESTIONS });

  const expiresAt = hoursFromNow(SUGGESTION_TTL_HOURS);
  const inserted = [];

  for (const match of matches) {
    const { rows } = await client.query(
      `INSERT INTO return_trip_suggestions (
         delivery_completion_id, booking_id, driver_id, farmer_id,
         pickup_distance_km, return_alignment_km, match_score, expires_at
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (delivery_completion_id, booking_id)
       DO UPDATE SET
         pickup_distance_km = EXCLUDED.pickup_distance_km,
         return_alignment_km = EXCLUDED.return_alignment_km,
         match_score = EXCLUDED.match_score,
         status = CASE
           WHEN return_trip_suggestions.status IN ('rejected', 'expired') THEN 'suggested'
           ELSE return_trip_suggestions.status
         END,
         suggested_at = NOW(),
         expires_at = EXCLUDED.expires_at,
         responded_at = NULL,
         rejection_reason = NULL
       RETURNING *`,
      [
        completionId,
        match.bookingId,
        driverId,
        match.farmerId,
        match.pickupDistanceKm,
        match.returnAlignmentKm,
        match.matchScore,
        expiresAt,
      ],
    );
    inserted.push(mapSuggestion(rows[0]));
  }

  return inserted;
}

export async function generateSuggestions(completionId, driverId) {
  return withTransaction(async client => {
    const suggestions = await generateSuggestionsInternal(client, completionId, driverId);
    return { completionId, count: suggestions.length, suggestions };
  });
}

export async function findNearbyForCompletion(completionId, { driverId } = {}) {
  const completion = await getCompletionById(null, completionId, driverId);
  const candidates = await fetchCandidateBookings({ query }, completion);
  const matches = findNearbyBookings(candidates, completion, { maxResults: MAX_SUGGESTIONS });

  return {
    completionId,
    driverLocation: {
      lat: completion.current_lat,
      lng: completion.current_lng,
      location: completion.current_location,
    },
    returnDestination: {
      location: completion.return_destination,
      lat: completion.return_lat,
      lng: completion.return_lng,
    },
    searchRadiusKm: completion.search_radius_km,
    matches,
  };
}

export async function listSuggestions({ driverId, farmerId, completionId, status, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (driverId) {
    conditions.push(`rts.driver_id = $${idx++}`);
    params.push(driverId);
  }
  if (farmerId) {
    conditions.push(`rts.farmer_id = $${idx++}`);
    params.push(farmerId);
  }
  if (completionId) {
    conditions.push(`rts.delivery_completion_id = $${idx++}`);
    params.push(completionId);
  }
  if (status) {
    conditions.push(`rts.status = $${idx++}`);
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM return_trip_suggestions rts ${where}`,
    params,
  );

  const { rows } = await query(
    `SELECT
       rts.*,
       b.start_location, b.end_location, b.scheduled_at, b.estimated_cost, b.cargo_weight_kg
     FROM return_trip_suggestions rts
     JOIN bookings b ON b.id = rts.booking_id
     ${where}
     ORDER BY rts.match_score ASC, rts.pickup_distance_km ASC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset],
  );

  return {
    suggestions: rows.map(r => ({
      ...mapSuggestion(r),
      booking: {
        start_location: r.start_location,
        end_location: r.end_location,
        scheduled_at: r.scheduled_at,
        estimated_cost: r.estimated_cost != null ? Number(r.estimated_cost) : null,
        cargo_weight_kg: r.cargo_weight_kg != null ? Number(r.cargo_weight_kg) : null,
      },
    })),
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit) || 0,
    },
  };
}

export async function acceptReturnTrip(suggestionId, driverId) {
  return withTransaction(async client => {
    const { rows: suggestionRows } = await client.query(
      `SELECT * FROM return_trip_suggestions WHERE id = $1 FOR UPDATE`,
      [suggestionId],
    );
    const suggestion = suggestionRows[0];

    if (!suggestion) throw createError(404, 'Return trip suggestion not found');
    if (suggestion.driver_id !== driverId) throw createError(403, 'Not authorized for this suggestion');
    if (suggestion.status !== SUGGESTION_STATUS.SUGGESTED) {
      throw createError(409, `Suggestion is '${suggestion.status}' and cannot be accepted`);
    }
    if (suggestion.expires_at && new Date(suggestion.expires_at) < new Date()) {
      await client.query(
        `UPDATE return_trip_suggestions SET status = $1, responded_at = NOW() WHERE id = $2`,
        [SUGGESTION_STATUS.EXPIRED, suggestionId],
      );
      throw createError(409, 'Suggestion has expired');
    }

    const completion = await getCompletionById(client, suggestion.delivery_completion_id, driverId, { lock: true });
    if (completion.status !== COMPLETION_STATUS.AVAILABLE) {
      throw createError(409, 'Driver is no longer available for return trips');
    }

    const { rows: bookingRows } = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [suggestion.booking_id],
    );
    const booking = bookingRows[0];

    if (!booking) throw createError(404, 'Suggested booking not found');
    if (booking.driver_id) throw createError(409, 'Booking already has a driver assigned');
    if (!MATCHABLE_BOOKING_STATUSES.includes(booking.status)) {
      throw createError(409, `Booking status '${booking.status}' is no longer available`);
    }

    const tripDistanceKm = haversineDistanceKm(
      booking.start_lat,
      booking.start_lng,
      booking.end_lat,
      booking.end_lng,
    );

    await client.query(
      `UPDATE return_trip_suggestions
       SET status = $1, responded_at = NOW()
       WHERE id = $2`,
      [SUGGESTION_STATUS.ACCEPTED, suggestionId],
    );

    await client.query(
      `UPDATE return_trip_suggestions
       SET status = $1, responded_at = NOW()
       WHERE delivery_completion_id = $2 AND id != $3 AND status = $4`,
      [SUGGESTION_STATUS.EXPIRED, completion.id, suggestionId, SUGGESTION_STATUS.SUGGESTED],
    );

    await client.query(
      `UPDATE driver_delivery_completions SET status = $1 WHERE id = $2`,
      [COMPLETION_STATUS.MATCHED, completion.id],
    );

    await client.query(
      `UPDATE bookings SET driver_id = $1, vehicle_id = COALESCE($2, vehicle_id), status = $3 WHERE id = $4`,
      [driverId, completion.vehicle_id, BOOKING_STATUS.ACCEPTED, booking.id],
    );

    await client.query(
      `INSERT INTO booking_timeline (booking_id, from_status, to_status, note, actor_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        booking.id,
        booking.status,
        BOOKING_STATUS.ACCEPTED,
        'Return trip accepted by driver',
        driverId,
        JSON.stringify({ suggestion_id: suggestionId, return_trip: true }),
      ],
    );

    const { rows: tripRows } = await client.query(
      `INSERT INTO return_trips (
         delivery_completion_id, suggestion_id, booking_id,
         driver_id, farmer_id, pickup_distance_km, trip_distance_km
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        completion.id,
        suggestionId,
        booking.id,
        driverId,
        suggestion.farmer_id,
        suggestion.pickup_distance_km,
        tripDistanceKm != null ? roundKm(tripDistanceKm) : null,
      ],
    );

    return {
      returnTrip: mapReturnTrip(tripRows[0]),
      booking: {
        id: booking.id,
        status: BOOKING_STATUS.ACCEPTED,
        driver_id: driverId,
      },
    };
  });
}

export async function rejectReturnTrip(suggestionId, driverId, { reason } = {}) {
  return withTransaction(async client => {
    const { rows } = await client.query(
      `SELECT * FROM return_trip_suggestions WHERE id = $1 FOR UPDATE`,
      [suggestionId],
    );
    const suggestion = rows[0];

    if (!suggestion) throw createError(404, 'Return trip suggestion not found');
    if (suggestion.driver_id !== driverId) throw createError(403, 'Not authorized for this suggestion');
    if (suggestion.status !== SUGGESTION_STATUS.SUGGESTED) {
      throw createError(409, `Suggestion is '${suggestion.status}' and cannot be rejected`);
    }

    const { rows: updated } = await client.query(
      `UPDATE return_trip_suggestions
       SET status = $1, responded_at = NOW(), rejection_reason = $2
       WHERE id = $3
       RETURNING *`,
      [SUGGESTION_STATUS.REJECTED, reason ?? null, suggestionId],
    );

    return mapSuggestion(updated[0]);
  });
}

export async function getDriverAvailability(driverId) {
  const { rows } = await query(
    `SELECT ${COMPLETION_COLUMNS}
     FROM driver_delivery_completions
     WHERE driver_id = $1 AND status = $2
     ORDER BY completed_at DESC
     LIMIT 1`,
    [driverId, COMPLETION_STATUS.AVAILABLE],
  );

  if (!rows[0]) {
    return { available: false, completion: null };
  }

  const completion = mapCompletion(rows[0]);
  const suggestionCount = await query(
    `SELECT COUNT(*)::int AS count FROM return_trip_suggestions
     WHERE delivery_completion_id = $1 AND status = $2`,
    [completion.id, SUGGESTION_STATUS.SUGGESTED],
  );

  return {
    available: true,
    completion,
    pendingSuggestions: suggestionCount.rows[0].count,
  };
}

export async function getTripHistory({ driverId, status, page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  const conditions = ['rt.driver_id = $1'];
  const params = [driverId];
  let idx = 2;

  if (status) {
    conditions.push(`rt.status = $${idx++}`);
    params.push(status);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM return_trips rt ${where}`,
    params,
  );

  const { rows } = await query(
    `SELECT
       rt.*,
       b.start_location, b.end_location, b.scheduled_at, b.status AS booking_status,
       ddc.delivery_destination, ddc.return_destination
     FROM return_trips rt
     JOIN bookings b ON b.id = rt.booking_id
     JOIN driver_delivery_completions ddc ON ddc.id = rt.delivery_completion_id
     ${where}
     ORDER BY rt.accepted_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset],
  );

  return {
    trips: rows.map(r => ({
      ...mapReturnTrip(r),
      booking: {
        start_location: r.start_location,
        end_location: r.end_location,
        scheduled_at: r.scheduled_at,
        status: r.booking_status,
      },
      priorDelivery: {
        destination: r.delivery_destination,
        returnDestination: r.return_destination,
      },
    })),
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit) || 0,
    },
  };
}

export async function completeReturnTrip(returnTripId, driverId) {
  return withTransaction(async client => {
    const { rows } = await client.query(
      `SELECT * FROM return_trips WHERE id = $1 AND driver_id = $2 FOR UPDATE`,
      [returnTripId, driverId],
    );
    const trip = rows[0];

    if (!trip) throw createError(404, 'Return trip not found');
    if (trip.status !== RETURN_TRIP_STATUS.ACTIVE) {
      throw createError(409, `Return trip is '${trip.status}'`);
    }

    const { rows: updated } = await client.query(
      `UPDATE return_trips SET status = $1, completed_at = NOW() WHERE id = $2 RETURNING *`,
      [RETURN_TRIP_STATUS.COMPLETED, returnTripId],
    );

    return mapReturnTrip(updated[0]);
  });
}
