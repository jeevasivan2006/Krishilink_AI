/**
 * tracking.api.js — Live Tracking
 * ─────────────────────────────────────────────────────────────────
 * POST  /tracking/location                          Update driver location
 * GET   /tracking/drivers/:driverId/location        Get driver's current location
 * POST  /tracking/bookings/:bookingId/start         Start tracking a booking
 * GET   /tracking/bookings/:bookingId               Get live tracking data
 * GET   /tracking/bookings/:bookingId/eta           Get estimated time of arrival
 * GET   /tracking/bookings/:bookingId/history       Location history (paginated)
 * POST  /tracking/bookings/:bookingId/route         Store planned route
 * GET   /tracking/bookings/:bookingId/route         Get stored route
 * POST  /tracking/bookings/:bookingId/complete      Mark tracking complete
 */

import api from './api';

/**
 * Push the driver's current GPS position to the server.
 * @param {{
 *   lat:          number,
 *   lng:          number,
 *   heading?:     number,   // 0–360 degrees
 *   speed_kmh?:   number,
 *   accuracy_m?:  number,
 *   booking_id?:  string,
 *   recorded_at?: string,   // ISO timestamp
 * }} payload
 */
export const updateLocation = async (payload) => {
  const { data } = await api.post('/tracking/location', payload);
  return data;
};

/**
 * Fetch a driver's last known location.
 * @param {string} driverId UUID
 */
export const getDriverLocation = async (driverId) => {
  const { data } = await api.get(`/tracking/drivers/${driverId}/location`);
  return data;
};

/**
 * Start live tracking for a booking.
 * @param {string} bookingId UUID
 */
export const startTracking = async (bookingId) => {
  const { data } = await api.post(`/tracking/bookings/${bookingId}/start`);
  return data;
};

/**
 * Get the current live tracking snapshot for a booking.
 * @param {string} bookingId UUID
 */
export const getBookingTracking = async (bookingId) => {
  const { data } = await api.get(`/tracking/bookings/${bookingId}`);
  return data;
};

/**
 * Get the ETA for a booking in transit.
 * @param {string} bookingId UUID
 */
export const getEta = async (bookingId) => {
  const { data } = await api.get(`/tracking/bookings/${bookingId}/eta`);
  return data;
};

/**
 * Fetch paginated GPS location history for a booking.
 * @param {string} bookingId UUID
 * @param {{ page?: number, limit?: number }} params
 */
export const getLocationHistory = async (bookingId, params = {}) => {
  const { data } = await api.get(`/tracking/bookings/${bookingId}/history`, { params });
  return data;
};

/**
 * Store the planned route for a booking (waypoints + polyline).
 * @param {string} bookingId UUID
 * @param {{
 *   origin_lat:       number,
 *   origin_lng:       number,
 *   destination_lat:  number,
 *   destination_lng:  number,
 *   waypoints?:       Array<{ lat, lng, label?, sequence? }>,
 *   encoded_polyline?: string,
 * }} payload
 */
export const storeRoute = async (bookingId, payload) => {
  const { data } = await api.post(`/tracking/bookings/${bookingId}/route`, payload);
  return data;
};

/**
 * Retrieve the stored route for a booking.
 * @param {string} bookingId UUID
 */
export const getRoute = async (bookingId) => {
  const { data } = await api.get(`/tracking/bookings/${bookingId}/route`);
  return data;
};

/**
 * Mark tracking as complete for a booking.
 * @param {string} bookingId UUID
 */
export const completeTracking = async (bookingId) => {
  const { data } = await api.post(`/tracking/bookings/${bookingId}/complete`);
  return data;
};
