/**
 * bookings.api.js — Bookings
 * ─────────────────────────────────────────────────────────────────
 * POST   /bookings                    Create booking
 * GET    /bookings                    List bookings (paginated)
 * GET    /bookings/:id                Get booking detail
 * GET    /bookings/:id/timeline       Get booking timeline
 * PATCH  /bookings/:id                Update booking
 * PATCH  /bookings/:id/status         Update booking status
 * DELETE /bookings/:id                Cancel booking
 */

import api from './api';

/**
 * Create a new booking.
 * @param {{
 *   start_location:  string,
 *   end_location:    string,
 *   scheduled_at:    string,   // ISO date, must be in the future
 *   cargo_weight_kg?: number,
 *   wants_shared?:   boolean,
 *   vehicle_id?:     string,
 *   estimated_cost?: number,
 *   notes?:          string,
 *   start_lat?:      number,
 *   start_lng?:      number,
 *   end_lat?:        number,
 *   end_lng?:        number,
 * }} payload
 */
export const createBooking = async (payload) => {
  const { data } = await api.post('/bookings', payload);
  return data;
};

/**
 * List bookings with optional filters.
 * @param {{ page?: number, limit?: number, status?: string, search?: string }} params
 */
export const listBookings = async (params = {}) => {
  const { data } = await api.get('/bookings', { params });
  return data;
};

/**
 * Get a single booking by ID.
 * @param {string} id UUID
 */
export const getBooking = async (id) => {
  const { data } = await api.get(`/bookings/${id}`);
  return data;
};

/**
 * Get the full timeline / audit trail of a booking.
 * @param {string} id UUID
 */
export const getBookingTimeline = async (id) => {
  const { data } = await api.get(`/bookings/${id}/timeline`);
  return data;
};

/**
 * Update mutable fields on a pending booking.
 * @param {string} id
 * @param {{
 *   start_location?: string,
 *   end_location?:   string,
 *   scheduled_at?:   string,
 *   vehicle_id?:     string | null,
 *   estimated_cost?: number | null,
 *   notes?:          string | null,
 *   start_lat?:      number | null,
 *   start_lng?:      number | null,
 *   end_lat?:        number | null,
 *   end_lng?:        number | null,
 * }} payload  At least one field required.
 */
export const updateBooking = async (id, payload) => {
  const { data } = await api.patch(`/bookings/${id}`, payload);
  return data;
};

/**
 * Transition a booking to a new status.
 * @param {string} id
 * @param {{
 *   status:       string,
 *   note?:        string,
 *   vehicle_id?:  string,
 *   driver_id?:   string,
 *   final_cost?:  number,
 *   metadata?:    object,
 * }} payload
 */
export const updateBookingStatus = async (id, payload) => {
  const { data } = await api.patch(`/bookings/${id}/status`, payload);
  return data;
};

/**
 * Cancel (soft-delete) a booking.
 * @param {string} id
 * @param {{ note?: string }} payload
 */
export const cancelBooking = async (id, payload = {}) => {
  const { data } = await api.delete(`/bookings/${id}`, { data: payload });
  return data;
};
