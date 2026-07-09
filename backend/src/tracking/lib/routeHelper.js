import { haversineDistanceKm } from '../../returnTrip/lib/distanceCalculator.js';
import { buildEtaResult, sumRouteDistanceKm } from './etaCalculator.js';
import { DEFAULT_AVG_SPEED_KMH } from '../constants/trackingStatus.js';

export { haversineDistanceKm, buildEtaResult, sumRouteDistanceKm };

export function resolveDestination(booking, route) {
  if (route?.destination_lat != null && route?.destination_lng != null) {
    return { lat: Number(route.destination_lat), lng: Number(route.destination_lng) };
  }
  if (booking.end_lat != null && booking.end_lng != null) {
    return { lat: Number(booking.end_lat), lng: Number(booking.end_lng) };
  }
  return null;
}

export function resolveOrigin(booking, route) {
  if (route?.origin_lat != null && route?.origin_lng != null) {
    return { lat: Number(route.origin_lat), lng: Number(route.origin_lng) };
  }
  if (booking.start_lat != null && booking.start_lng != null) {
    return { lat: Number(booking.start_lat), lng: Number(booking.start_lng) };
  }
  return null;
}

export function computeLiveEta({ currentLat, currentLng, speedKmh, booking, route }) {
  const destination = resolveDestination(booking, route);
  if (!destination) {
    return null;
  }

  const distanceRemainingKm = haversineDistanceKm(
    currentLat,
    currentLng,
    destination.lat,
    destination.lng,
  );

  if (distanceRemainingKm === null) return null;

  return buildEtaResult({
    distanceRemainingKm,
    speedKmh,
    fallbackSpeedKmh: DEFAULT_AVG_SPEED_KMH,
  });
}

export function normalizeWaypoints(waypoints) {
  if (!Array.isArray(waypoints)) return [];
  return waypoints.map((wp, index) => ({
    lat: Number(wp.lat),
    lng: Number(wp.lng),
    label: wp.label ?? `Waypoint ${index + 1}`,
    sequence: wp.sequence ?? index + 1,
  })).filter(wp => !Number.isNaN(wp.lat) && !Number.isNaN(wp.lng));
}

export function buildRouteFromInput({ origin_lat, origin_lng, destination_lat, destination_lng, waypoints }) {
  const normalized = normalizeWaypoints(waypoints ?? []);
  const fullPath = [
    { lat: Number(origin_lat), lng: Number(origin_lng), label: 'Origin', sequence: 0 },
    ...normalized,
    { lat: Number(destination_lat), lng: Number(destination_lng), label: 'Destination', sequence: normalized.length + 1 },
  ];

  const plannedDistanceKm = sumRouteDistanceKm(fullPath, haversineDistanceKm);
  const plannedDurationMinutes = Math.round((plannedDistanceKm / DEFAULT_AVG_SPEED_KMH) * 60);

  return {
    origin_lat: Number(origin_lat),
    origin_lng: Number(origin_lng),
    destination_lat: Number(destination_lat),
    destination_lng: Number(destination_lng),
    waypoints: normalized,
    planned_distance_km: plannedDistanceKm,
    planned_duration_minutes: plannedDurationMinutes,
    fullPath,
  };
}
