/**
 * returnTrip.api.js — Return-Trip Marketplace
 * ─────────────────────────────────────────────────────────────────
 * POST  /return-trips/completions                            Record trip completion
 * GET   /return-trips/availability                           Driver availability
 * GET   /return-trips/suggestions                            List suggestions
 * POST  /return-trips/suggestions/:suggestionId/accept       Accept suggestion
 * POST  /return-trips/suggestions/:suggestionId/reject       Reject suggestion
 * GET   /return-trips/completions/:completionId/nearby       Find nearby farmers
 * POST  /return-trips/completions/:completionId/suggest      Generate suggestions
 * GET   /return-trips/history                                Return-trip history
 * POST  /return-trips/trips/:returnTripId/complete           Complete return trip
 */

import api from './api';

/**
 * Record that a delivery has been completed and driver is ready for a return trip.
 * @param {{
 *   booking_id:             string,
 *   vehicle_id?:            string,
 *   current_lat:            number,
 *   current_lng:            number,
 *   current_location?:      string,
 *   delivery_destination?:  string,
 *   delivery_lat?:          number,
 *   delivery_lng?:          number,
 *   return_destination?:    string,
 *   return_lat?:            number,
 *   return_lng?:            number,
 *   search_radius_km?:      number,
 * }} payload
 */
export const recordCompletion = async (payload) => {
  const { data } = await api.post('/return-trips/completions', payload);
  return data;
};

/**
 * Get all currently available return-trip drivers.
 */
export const getReturnTripAvailability = async () => {
  const { data } = await api.get('/return-trips/availability');
  return data;
};

/**
 * List return-trip suggestions for the current user.
 * @param {{
 *   completion_id?: string,
 *   status?:        string,
 *   page?:          number,
 *   limit?:         number,
 * }} params
 */
export const listSuggestions = async (params = {}) => {
  const { data } = await api.get('/return-trips/suggestions', { params });
  return data;
};

/**
 * Accept a return-trip suggestion.
 * @param {string} suggestionId UUID
 */
export const acceptSuggestion = async (suggestionId) => {
  const { data } = await api.post(`/return-trips/suggestions/${suggestionId}/accept`);
  return data;
};

/**
 * Reject a return-trip suggestion.
 * @param {string} suggestionId UUID
 * @param {{ reason?: string }} payload
 */
export const rejectSuggestion = async (suggestionId, payload = {}) => {
  const { data } = await api.post(`/return-trips/suggestions/${suggestionId}/reject`, payload);
  return data;
};

/**
 * Find nearby farmers that could be picked up on a return trip.
 * @param {string} completionId UUID
 */
export const findNearbyFarmers = async (completionId) => {
  const { data } = await api.get(`/return-trips/completions/${completionId}/nearby`);
  return data;
};

/**
 * Trigger AI-based suggestion generation for a completed trip.
 * @param {string} completionId UUID
 */
export const generateSuggestions = async (completionId) => {
  const { data } = await api.post(`/return-trips/completions/${completionId}/suggest`);
  return data;
};

/**
 * List return-trip history for the authenticated driver.
 * @param {{ status?: string, page?: number, limit?: number }} params
 */
export const getReturnTripHistory = async (params = {}) => {
  const { data } = await api.get('/return-trips/history', { params });
  return data;
};

/**
 * Mark a return trip as completed.
 * @param {string} returnTripId UUID
 */
export const completeReturnTrip = async (returnTripId) => {
  const { data } = await api.post(`/return-trips/trips/${returnTripId}/complete`);
  return data;
};
