import createError from 'http-errors';
import { VEHICLE_TYPES } from '../constants/recommendationSchema.js';

function formatDuration(minutes) {
  const total = Math.round(Number(minutes));
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function validateSuggestionBlock(block, fieldName) {
  if (!block || typeof block !== 'object') {
    throw createError(502, `Gemini response missing ${fieldName}`);
  }
  if (typeof block.recommended !== 'boolean') {
    throw createError(502, `Gemini response: ${fieldName}.recommended must be boolean`);
  }
  if (typeof block.reason !== 'string' || !block.reason.trim()) {
    throw createError(502, `Gemini response: ${fieldName}.reason must be a non-empty string`);
  }
  return { recommended: block.recommended, reason: block.reason.trim() };
}

export function extractTextFromGeminiResponse(apiResponse) {
  const candidate = apiResponse?.candidates?.[0];
  if (!candidate) {
    throw createError(502, 'Gemini returned no candidates');
  }

  if (candidate.finishReason === 'SAFETY') {
    throw createError(422, 'Gemini blocked the request due to safety filters');
  }

  const parts = candidate.content?.parts;
  if (!parts?.length) {
    throw createError(502, 'Gemini returned empty content');
  }

  return parts.map(p => p.text ?? '').join('').trim();
}

export function parseRecommendationJson(rawText) {
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw createError(502, 'Gemini returned invalid JSON');
    }
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw createError(502, 'Gemini returned malformed JSON');
    }
  }
  return normalizeRecommendation(parsed);
}

export function normalizeRecommendation(raw) {
  const vehicle = raw.recommended_vehicle ?? raw.recommendedVehicle;
  if (!vehicle || !VEHICLE_TYPES.includes(vehicle)) {
    throw createError(502, `Gemini returned invalid vehicle type: ${vehicle}`);
  }

  const cost = Number(raw.estimated_cost_inr ?? raw.estimatedCostInr ?? raw.estimated_cost);
  if (Number.isNaN(cost) || cost <= 0) {
    throw createError(502, 'Gemini returned invalid estimated cost');
  }

  const durationMinutes = Number(
    raw.estimated_duration_minutes ?? raw.estimatedDurationMinutes ?? raw.estimated_duration,
  );
  if (Number.isNaN(durationMinutes) || durationMinutes < 1) {
    throw createError(502, 'Gemini returned invalid estimated duration');
  }

  const sharedTruck = validateSuggestionBlock(
    raw.shared_truck_suggestion ?? raw.sharedTruckSuggestion,
    'shared_truck_suggestion',
  );

  const returnTrip = validateSuggestionBlock(
    raw.return_trip_suggestion ?? raw.returnTripSuggestion,
    'return_trip_suggestion',
  );

  return {
    recommendedVehicle: vehicle,
    estimatedCost: Math.round(cost * 100) / 100,
    estimatedDurationMinutes: Math.round(durationMinutes),
    estimatedDuration: formatDuration(durationMinutes),
    sharedTruckSuggestion: sharedTruck,
    returnTripSuggestion: returnTrip,
  };
}
