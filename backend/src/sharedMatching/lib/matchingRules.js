/**
 * Route and date matching rules — pure functions, reusable across services and jobs.
 */

export function normalizeLocation(location) {
  if (!location || typeof location !== 'string') return '';
  return location.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function locationKey(location) {
  return normalizeLocation(location);
}

export function toScheduledDate(scheduledAt) {
  const date = scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function isSameLocation(locationA, locationB) {
  return locationKey(locationA) === locationKey(locationB);
}

export function isSameDate(scheduledAtA, scheduledAtB) {
  const dateA = toScheduledDate(scheduledAtA);
  const dateB = toScheduledDate(scheduledAtB);
  return dateA !== null && dateA === dateB;
}

export function isSameRoute(bookingA, bookingB) {
  return (
    isSameLocation(bookingA.start_location ?? bookingA.startLocation, bookingB.start_location ?? bookingB.startLocation)
    && isSameLocation(bookingA.end_location ?? bookingA.endLocation, bookingB.end_location ?? bookingB.endLocation)
  );
}

export function matchesGroupCriteria(booking, group) {
  const bookingDate = toScheduledDate(booking.scheduled_at ?? booking.scheduledAt);
  const groupDate = group.scheduled_date ?? group.scheduledDate;

  const pickupMatch = locationKey(booking.start_location ?? booking.startLocation)
    === (group.start_location_key ?? group.startLocationKey ?? locationKey(group.start_location ?? group.startLocation));

  const destMatch = locationKey(booking.end_location ?? booking.endLocation)
    === (group.end_location_key ?? group.endLocationKey ?? locationKey(group.end_location ?? group.endLocation));

  return pickupMatch && destMatch && bookingDate === groupDate;
}

export function buildRouteKey(booking) {
  return {
    startLocationKey: locationKey(booking.start_location ?? booking.startLocation),
    endLocationKey: locationKey(booking.end_location ?? booking.endLocation),
    scheduledDate: toScheduledDate(booking.scheduled_at ?? booking.scheduledAt),
  };
}

export function describeMatchCriteria(booking) {
  const route = buildRouteKey(booking);
  return {
    pickup: booking.start_location ?? booking.startLocation,
    destination: booking.end_location ?? booking.endLocation,
    date: route.scheduledDate,
    cargoWeightKg: Number(booking.cargo_weight_kg ?? booking.cargoWeightKg),
  };
}
