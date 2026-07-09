const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Haversine distance between two coordinates in kilometres.
 */
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const aLat = Number(lat1);
  const aLng = Number(lng1);
  const bLat = Number(lat2);
  const bLng = Number(lng2);

  if ([aLat, aLng, bLat, bLng].some(v => Number.isNaN(v))) return null;

  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h = sinLat * sinLat
    + Math.cos(toRadians(aLat)) * Math.cos(toRadians(bLat)) * sinLng * sinLng;

  return roundKm(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h)));
}

export function isWithinRadius(originLat, originLng, targetLat, targetLng, radiusKm) {
  const distance = haversineDistanceKm(originLat, originLng, targetLat, targetLng);
  if (distance === null) return false;
  return distance <= Number(radiusKm);
}

/**
 * Bounding-box degree delta for a SQL pre-filter (rough approximation).
 */
export function boundingBoxDelta(radiusKm) {
  const kmPerDegree = 111.32;
  return Number(radiusKm) / kmPerDegree;
}

export function roundKm(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(Number(value) * factor) / factor;
}
