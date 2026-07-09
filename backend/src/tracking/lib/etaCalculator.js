import { MIN_ETA_MINUTES } from '../constants/trackingStatus.js';

function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(Number(value) * factor) / factor;
}

export function formatDuration(minutes) {
  const total = Math.max(Math.round(Number(minutes)), 0);
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * ETA from distance remaining and speed (km/h).
 */
export function calculateEtaMinutes(distanceRemainingKm, speedKmh, fallbackSpeedKmh = 45) {
  const distance = Number(distanceRemainingKm);
  if (Number.isNaN(distance) || distance <= 0) return MIN_ETA_MINUTES;

  let speed = Number(speedKmh);
  if (Number.isNaN(speed) || speed < 5) {
    speed = Number(fallbackSpeedKmh) || 45;
  }

  const minutes = (distance / speed) * 60;
  return Math.max(Math.round(minutes), MIN_ETA_MINUTES);
}

export function calculateEtaArrival(etaMinutes, fromDate = new Date()) {
  return new Date(fromDate.getTime() + etaMinutes * 60 * 1000).toISOString();
}

export function buildEtaResult({ distanceRemainingKm, speedKmh, fallbackSpeedKmh = 45 }) {
  const etaMinutes = calculateEtaMinutes(distanceRemainingKm, speedKmh, fallbackSpeedKmh);
  const calculatedAt = new Date().toISOString();

  return {
    distanceRemainingKm: round(distanceRemainingKm),
    speedKmh: round(speedKmh > 0 ? speedKmh : fallbackSpeedKmh),
    etaMinutes,
    etaFormatted: formatDuration(etaMinutes),
    estimatedArrivalAt: calculateEtaArrival(etaMinutes),
    calculatedAt,
  };
}

export function sumRouteDistanceKm(waypoints, haversineFn) {
  if (!Array.isArray(waypoints) || waypoints.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const segment = haversineFn(prev.lat, prev.lng, curr.lat, curr.lng);
    if (segment != null) total += segment;
  }
  return round(total);
}
