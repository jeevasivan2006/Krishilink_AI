/**
 * farmer.api.js — Farmer Module
 * ─────────────────────────────────────────────────────────────────
 * GET   /farmer/dashboard                 Farmer dashboard stats
 * GET   /farmer/profile                   Farmer profile
 * POST  /farmer/bookings                  Book transport
 * GET   /farmer/bookings                  Farmer booking history
 * GET   /farmer/bookings/:bookingId       Booking detail
 * DELETE /farmer/bookings/:bookingId      Cancel booking
 * GET   /farmer/estimate-cost             Estimate transport cost
 */

import api from './api';

/**
 * Fetch the farmer's dashboard summary (stats, recent bookings, alerts).
 */
export const getFarmerDashboard = async () => {
  const { data } = await api.get('/farmer/dashboard');
  return data;
};

/**
 * Fetch the authenticated farmer's profile.
 */
export const getFarmerProfile = async () => {
  const { data } = await api.get('/farmer/profile');
  return data;
};

/**
 * Book transport for farm produce.
 * @param {{
 *   start_location:  string,
 *   end_location:    string,
 *   scheduled_at:    string,
 *   cargo_weight_kg?: number,
 *   wants_shared?:   boolean,
 *   vehicle_id?:     string,
 *   notes?:          string,
 * }} payload
 */
export const farmerBookTransport = async (payload) => {
  const { data } = await api.post('/farmer/bookings', payload);
  return data;
};

/**
 * List the farmer's booking history.
 * @param {{ page?: number, limit?: number, status?: string }} params
 */
export const getFarmerBookingHistory = async (params = {}) => {
  const { data } = await api.get('/farmer/bookings', { params });
  return data;
};

/**
 * Get a specific booking detail for the farmer.
 * @param {string} bookingId UUID
 */
export const getFarmerBookingDetail = async (bookingId) => {
  const { data } = await api.get(`/farmer/bookings/${bookingId}`);
  return data;
};

/**
 * Cancel a booking as farmer.
 * @param {string} bookingId UUID
 */
export const farmerCancelBooking = async (bookingId) => {
  const { data } = await api.delete(`/farmer/bookings/${bookingId}`);
  return data;
};

/**
 * Get an estimated transport cost before booking.
 * @param {{
 *   start_location: string,
 *   end_location:   string,
 *   cargo_weight_kg?: number,
 *   vehicle_type?:  string,
 * }} params
 */
export const getEstimatedCost = async (params) => {
  const { data } = await api.get('/farmer/estimate-cost', { params });
  return data;
};
