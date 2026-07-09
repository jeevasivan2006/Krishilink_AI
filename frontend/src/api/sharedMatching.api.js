/**
 * sharedMatching.api.js — Shared Truck Matching
 * ─────────────────────────────────────────────────────────────────
 * GET    /shared-groups                                List groups
 * GET    /shared-groups/matches/:bookingId             Find matches for booking
 * POST   /shared-groups/auto-match/:bookingId          Auto-match booking to group
 * GET    /shared-groups/:groupId                       Get group detail
 * GET    /shared-groups/:groupId/capacity              Group remaining capacity
 * GET    /shared-groups/:groupId/cost-split            Cost split calculation
 * POST   /shared-groups/:groupId/join/:bookingId       Join a group
 * DELETE /shared-groups/:groupId/members/:bookingId    Leave a group
 */

import api from './api';

/**
 * List shared matching groups with optional filters.
 * @param {{ page?: number, limit?: number, status?: string }} params
 */
export const listSharedGroups = async (params = {}) => {
  const { data } = await api.get('/shared-groups', { params });
  return data;
};

/**
 * Find compatible shared groups for a given booking.
 * @param {string} bookingId UUID
 */
export const findGroupMatches = async (bookingId) => {
  const { data } = await api.get(`/shared-groups/matches/${bookingId}`);
  return data;
};

/**
 * Automatically match a booking to the best available group.
 * @param {string} bookingId UUID
 * @param {object} payload   Optional join preferences
 */
export const autoMatchBooking = async (bookingId, payload = {}) => {
  const { data } = await api.post(`/shared-groups/auto-match/${bookingId}`, payload);
  return data;
};

/**
 * Get detail for a specific shared group.
 * @param {string} groupId UUID
 */
export const getSharedGroup = async (groupId) => {
  const { data } = await api.get(`/shared-groups/${groupId}`);
  return data;
};

/**
 * Get remaining cargo capacity in a shared group.
 * @param {string} groupId UUID
 */
export const getGroupCapacity = async (groupId) => {
  const { data } = await api.get(`/shared-groups/${groupId}/capacity`);
  return data;
};

/**
 * Get the cost-split breakdown for a shared group.
 * @param {string} groupId UUID
 */
export const getGroupCostSplit = async (groupId) => {
  const { data } = await api.get(`/shared-groups/${groupId}/cost-split`);
  return data;
};

/**
 * Join a shared group with a booking.
 * @param {string} groupId   UUID
 * @param {string} bookingId UUID
 */
export const joinSharedGroup = async (groupId, bookingId) => {
  const { data } = await api.post(`/shared-groups/${groupId}/join/${bookingId}`);
  return data;
};

/**
 * Remove a booking from a shared group.
 * @param {string} groupId   UUID
 * @param {string} bookingId UUID
 */
export const leaveSharedGroup = async (groupId, bookingId) => {
  const { data } = await api.delete(`/shared-groups/${groupId}/members/${bookingId}`);
  return data;
};
