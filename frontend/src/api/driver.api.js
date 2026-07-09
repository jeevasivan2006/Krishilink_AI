/**
 * driver.api.js — Driver Module
 * ─────────────────────────────────────────────────────────────────
 * GET   /driver/dashboard                    Driver dashboard
 * POST  /driver/bookings/:bookingId/accept   Accept a booking request
 * POST  /driver/bookings/:bookingId/reject   Reject a booking request
 */

import api from './api';

/**
 * Fetch the driver's dashboard (stats, pending requests, active trip).
 */
export const getDriverDashboard = async () => {
  const { data } = await api.get('/driver/dashboard');
  return data;
};

/**
 * Accept an incoming booking request.
 * @param {string} bookingId UUID
 */
export const acceptBooking = async (bookingId) => {
  const { data } = await api.post(`/driver/bookings/${bookingId}/accept`);
  return data;
};

/**
 * Reject an incoming booking request.
 * @param {string} bookingId UUID
 * @param {{ reason?: string }} payload  Optional rejection reason
 */
export const rejectBooking = async (bookingId, payload = {}) => {
  const { data } = await api.post(`/driver/bookings/${bookingId}/reject`, payload);
  return data;
};

/**
 * Update driver availability status.
 * @param {string} availability 'available' | 'busy' | 'offline'
 */
export const updateAvailability = async (availability) => {
  const { data } = await api.put('/driver/availability', { availability });
  return data;
};
