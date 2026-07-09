import { haversineDistanceKm, roundKm } from './distanceCalculator.js';

/**
 * Score a return-trip match. Lower score = better match.
 * Factors: pickup proximity (70%), return-route alignment (30%).
 */
export function scoreReturnTripMatch({
  pickupDistanceKm,
  returnAlignmentKm,
  maxRadiusKm,
}) {
  const pickup = Number(pickupDistanceKm);
  const alignment = returnAlignmentKm != null ? Number(returnAlignmentKm) : maxRadiusKm;
  const radius = Number(maxRadiusKm) || 50;

  const pickupScore = Math.min(pickup / radius, 1) * 70;
  const alignmentScore = Math.min(alignment / radius, 1) * 30;

  return roundKm(pickupScore + alignmentScore);
}

/**
 * How close the booking destination is to the driver's return destination.
 * Lower = better alignment for a return load.
 */
export function calculateReturnAlignmentKm(booking, driverReturn) {
  const bookingEndLat = booking.end_lat ?? booking.endLat;
  const bookingEndLng = booking.end_lng ?? booking.endLng;
  const returnLat = driverReturn.return_lat ?? driverReturn.returnLat;
  const returnLng = driverReturn.return_lng ?? driverReturn.returnLng;

  if (bookingEndLat == null || bookingEndLng == null || returnLat == null || returnLng == null) {
    return null;
  }

  return haversineDistanceKm(bookingEndLat, bookingEndLng, returnLat, returnLng);
}

export function matchBookingToDriver(booking, driverContext) {
  const pickupLat = booking.start_lat ?? booking.startLat;
  const pickupLng = booking.start_lng ?? booking.startLng;

  if (pickupLat == null || pickupLng == null) return null;

  const pickupDistanceKm = haversineDistanceKm(
    driverContext.current_lat ?? driverContext.currentLat,
    driverContext.current_lng ?? driverContext.currentLng,
    pickupLat,
    pickupLng,
  );

  if (pickupDistanceKm === null) return null;

  const radius = Number(driverContext.search_radius_km ?? driverContext.searchRadiusKm ?? 50);
  if (pickupDistanceKm > radius) return null;

  const returnAlignmentKm = calculateReturnAlignmentKm(booking, driverContext);
  const matchScore = scoreReturnTripMatch({
    pickupDistanceKm,
    returnAlignmentKm,
    maxRadiusKm: radius,
  });

  return {
    bookingId: booking.id ?? booking.booking_id,
    farmerId: booking.farmer_id ?? booking.farmerId,
    pickup: booking.start_location ?? booking.startLocation,
    destination: booking.end_location ?? booking.endLocation,
    scheduledAt: booking.scheduled_at ?? booking.scheduledAt,
    cargoWeightKg: booking.cargo_weight_kg != null ? Number(booking.cargo_weight_kg) : null,
    estimatedCost: booking.estimated_cost != null ? Number(booking.estimated_cost) : null,
    pickupDistanceKm: roundKm(pickupDistanceKm),
    returnAlignmentKm: returnAlignmentKm != null ? roundKm(returnAlignmentKm) : null,
    matchScore,
  };
}

export function rankMatches(matches) {
  return [...matches].sort((a, b) => {
    if (a.matchScore !== b.matchScore) return a.matchScore - b.matchScore;
    return a.pickupDistanceKm - b.pickupDistanceKm;
  });
}

export function findNearbyBookings(bookings, driverContext, { maxResults = 10 } = {}) {
  const matches = bookings
    .map(booking => matchBookingToDriver(booking, driverContext))
    .filter(Boolean);

  return rankMatches(matches).slice(0, maxResults);
}
