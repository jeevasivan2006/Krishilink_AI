/**
 * notifications.api.js — Notifications
 * ─────────────────────────────────────────────────────────────────
 * GET    /notifications/events        SSE event stream
 * POST   /notifications/preview       Preview a notification
 * POST   /notifications/booking       Send booking notification
 * POST   /notifications/trip          Send trip notification
 * POST   /notifications/return-trip   Send return-trip alert
 * POST   /notifications/shared-truck  Send shared-truck alert
 * GET    /notifications               List user notifications
 * PATCH  /notifications/read-all      Mark all as read
 * GET    /notifications/:id           Get single notification
 * PATCH  /notifications/:id/read      Mark single as read
 */

import api from './api';

/**
 * List the authenticated user's notifications.
 * @param {{ page?: number, limit?: number }} params
 */
export const listNotifications = async (params = {}) => {
  const { data } = await api.get('/notifications', { params });
  return data;
};

/**
 * Get a single notification by ID.
 * @param {string} id UUID
 */
export const getNotification = async (id) => {
  const { data } = await api.get(`/notifications/${id}`);
  return data;
};

/**
 * Mark a single notification as read.
 * @param {string} id UUID
 */
export const markNotificationRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
};

/**
 * Mark all notifications as read for the current user.
 */
export const markAllNotificationsRead = async () => {
  const { data } = await api.patch('/notifications/read-all');
  return data;
};

export const deleteNotification = async (id) => {
  const { data } = await api.delete(`/notifications/${id}`);
  return data;
};

/**
 * Preview a notification without sending it.
 * @param {{ type: string, payload: object }} body
 */
export const previewNotification = async (body) => {
  const { data } = await api.post('/notifications/preview', body);
  return data;
};

/**
 * Send a booking-related notification.
 * @param {object} payload
 */
export const sendBookingNotification = async (payload) => {
  const { data } = await api.post('/notifications/booking', payload);
  return data;
};

/**
 * Send a trip-related notification.
 * @param {object} payload
 */
export const sendTripNotification = async (payload) => {
  const { data } = await api.post('/notifications/trip', payload);
  return data;
};

/**
 * Send a return-trip availability alert.
 * @param {object} payload
 */
export const sendReturnTripAlert = async (payload) => {
  const { data } = await api.post('/notifications/return-trip', payload);
  return data;
};

/**
 * Send a shared-truck availability alert.
 * @param {object} payload
 */
export const sendSharedTruckAlert = async (payload) => {
  const { data } = await api.post('/notifications/shared-truck', payload);
  return data;
};

/**
 * Returns the SSE events URL for use with EventSource.
 * (Not an Axios call — EventSource handles this natively.)
 * Usage:
 *   const source = new EventSource(getNotificationEventsUrl());
 */
export const getNotificationEventsUrl = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('krishilink_token');
  return `${base}/api/v1/notifications/events?token=${token}`;
};
