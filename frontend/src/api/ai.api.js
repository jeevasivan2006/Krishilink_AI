/**
 * ai.api.js — AI Recommendations (Gemini-powered)
 * ─────────────────────────────────────────────────────────────────
 * POST  /ai/recommend    Get transport recommendation for farm produce
 */

import api from './api';

/**
 * Get an AI-generated transport recommendation.
 *
 * @param {{
 *   pickup:        string,   min 1 char, max 500
 *   destination:   string,   min 1 char, max 500
 *   crop_type:     string,   min 1 char, max 100
 *   weight_kg:     number,   0.01 – 50000
 *   delivery_date: string,   ISO date, must be >= today
 * }} payload
 * @returns {Promise<object>} AI recommendation result
 */
export const getAiRecommendation = async (payload) => {
  const { data } = await api.post('/ai/recommend', payload);
  return data;
};
