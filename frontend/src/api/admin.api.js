/**
 * admin.api.js — Admin Panel
 * ─────────────────────────────────────────────────────────────────
 * Dashboard
 *   GET    /admin/dashboard
 *
 * Users CRUD
 *   GET    /admin/users
 *   GET    /admin/users/:userId
 *   POST   /admin/users
 *   PUT    /admin/users/:userId
 *   DELETE /admin/users/:userId
 *
 * Drivers
 *   GET    /admin/drivers
 *   GET    /admin/drivers/:driverId
 *   PUT    /admin/drivers/:driverId
 *
 * Bookings
 *   GET    /admin/bookings
 *   GET    /admin/bookings/:bookingId
 *   PATCH  /admin/bookings/:bookingId/status
 *
 * Analytics
 *   GET    /admin/analytics                  period query
 *   GET    /admin/analytics/bookings         period + group_by
 *   GET    /admin/revenue                    period query
 *
 * Reports
 *   GET    /admin/reports/bookings
 *   GET    /admin/reports/revenue
 *   GET    /admin/reports/users
 *
 * Monitoring
 *   GET    /admin/monitoring
 *   GET    /admin/monitoring/active-trips
 *   GET    /admin/monitoring/attention
 *   GET    /admin/monitoring/:bookingId
 */

import api from './api';

/* ── Dashboard ─────────────────────────────────────────────────── */

/** Fetch admin dashboard KPIs and recent activity. */
export const getAdminDashboard = async () => {
  const { data } = await api.get('/admin/dashboard');
  return data;
};

/* ── Users ─────────────────────────────────────────────────────── */

/**
 * List users with optional filters.
 * @param {{
 *   page?:   number,
 *   limit?:  number,
 *   role?:   'farmer'|'driver'|'admin',
 *   status?: 'active'|'inactive'|'suspended'|'pending',
 *   search?: string,
 * }} params
 */
export const listAdminUsers = async (params = {}) => {
  const { data } = await api.get('/admin/users', { params });
  return data;
};

/**
 * Get a single user by ID.
 * @param {string} userId UUID
 */
export const getAdminUser = async (userId) => {
  const { data } = await api.get(`/admin/users/${userId}`);
  return data;
};

/**
 * Create a new user from the admin panel.
 * @param {{
 *   name:    string,
 *   email:   string,
 *   role:    string,
 *   phone?:  string,
 *   status?: string,
 * }} payload
 */
export const createAdminUser = async (payload) => {
  const { data } = await api.post('/admin/users', payload);
  return data;
};

/**
 * Update a user's details.
 * @param {string} userId UUID
 * @param {{ name?, email?, phone?, role?, status? }} payload  At least one field.
 */
export const updateAdminUser = async (userId, payload) => {
  const { data } = await api.put(`/admin/users/${userId}`, payload);
  return data;
};

/**
 * Delete a user.
 * @param {string} userId UUID
 */
export const deleteAdminUser = async (userId) => {
  const { data } = await api.delete(`/admin/users/${userId}`);
  return data;
};

/* ── Drivers ───────────────────────────────────────────────────── */

/**
 * List drivers with optional filters.
 * @param {{
 *   page?:          number,
 *   limit?:         number,
 *   availability?:  'available'|'busy'|'offline',
 *   status?:        string,
 *   search?:        string,
 * }} params
 */
export const listAdminDrivers = async (params = {}) => {
  const { data } = await api.get('/admin/drivers', { params });
  return data;
};

/**
 * Get a single driver's admin detail.
 * @param {string} driverId UUID
 */
export const getAdminDriver = async (driverId) => {
  const { data } = await api.get(`/admin/drivers/${driverId}`);
  return data;
};

/**
 * Update driver details / status from admin.
 * @param {string} driverId UUID
 * @param {{
 *   name?,        phone?,      status?,
 *   license_number?, vehicle_type?, vehicle_number?,
 *   availability?, rating?
 * }} payload  At least one field.
 */
export const updateAdminDriver = async (driverId, payload) => {
  const { data } = await api.put(`/admin/drivers/${driverId}`, payload);
  return data;
};

/* ── Bookings ──────────────────────────────────────────────────── */

/**
 * List all bookings (admin view with extended filters).
 * @param {{
 *   page?:      number,
 *   limit?:     number,
 *   status?:    string,
 *   farmer_id?: string,
 *   driver_id?: string,
 *   search?:    string,
 *   date_from?: string,
 *   date_to?:   string,
 * }} params
 */
export const listAdminBookings = async (params = {}) => {
  const { data } = await api.get('/admin/bookings', { params });
  return data;
};

/**
 * Get a single booking (admin view).
 * @param {string} bookingId UUID
 */
export const getAdminBooking = async (bookingId) => {
  const { data } = await api.get(`/admin/bookings/${bookingId}`);
  return data;
};

/**
 * Override a booking's status from the admin panel.
 * @param {string} bookingId UUID
 * @param {{ status: string, note?: string }} payload
 */
export const updateAdminBookingStatus = async (bookingId, payload) => {
  const { data } = await api.patch(`/admin/bookings/${bookingId}/status`, payload);
  return data;
};

/* ── Analytics ─────────────────────────────────────────────────── */

/**
 * Fetch overall analytics for a time period.
 * @param {{ period?: '7d'|'30d'|'90d'|'1y' }} params
 */
export const getAnalytics = async (params = {}) => {
  const { data } = await api.get('/admin/analytics', { params });
  return data;
};

/**
 * Fetch booking-specific analytics.
 * @param {{ period?: string, group_by?: 'day'|'week'|'month' }} params
 */
export const getBookingsAnalytics = async (params = {}) => {
  const { data } = await api.get('/admin/analytics/bookings', { params });
  return data;
};

/**
 * Fetch revenue data for a time period.
 * @param {{ period?: '7d'|'30d'|'90d'|'1y' }} params
 */
export const getRevenue = async (params = {}) => {
  const { data } = await api.get('/admin/revenue', { params });
  return data;
};

/* ── Reports ───────────────────────────────────────────────────── */

/** @param {{ period?: string }} params */
export const getBookingsReport = async (params = {}) => {
  const { data } = await api.get('/admin/reports/bookings', { params });
  return data;
};

/** @param {{ period?: string }} params */
export const getRevenueReport = async (params = {}) => {
  const { data } = await api.get('/admin/reports/revenue', { params });
  return data;
};

export const getUsersReport = async () => {
  const { data } = await api.get('/admin/reports/users');
  return data;
};

/* ── Monitoring ────────────────────────────────────────────────── */

/**
 * Get live booking monitoring feed.
 * @param {{ page?: number, limit?: number, status?: string }} params
 */
export const getMonitoring = async (params = {}) => {
  const { data } = await api.get('/admin/monitoring', { params });
  return data;
};

/** Get all bookings currently in active transit. */
export const getActiveTrips = async () => {
  const { data } = await api.get('/admin/monitoring/active-trips');
  return data;
};

/** Get bookings that require admin attention (stuck, delayed, disputed). */
export const getAttentionRequired = async () => {
  const { data } = await api.get('/admin/monitoring/attention');
  return data;
};

/**
 * Get monitoring detail for a specific booking.
 * @param {string} bookingId UUID
 */
export const getMonitoringDetail = async (bookingId) => {
  const { data } = await api.get(`/admin/monitoring/${bookingId}`);
  return data;
};
