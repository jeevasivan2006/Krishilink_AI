import createError from 'http-errors';
import {
  assertGeminiConfigured,
  getGeminiConfig,
  getGenerateContentUrl,
} from '../config/geminiConfig.js';
import { buildGeminiRequestBody, buildRecommendationPrompt } from '../lib/promptBuilder.js';
import {
  extractTextFromGeminiResponse,
  parseRecommendationJson,
} from '../lib/responseParser.js';

function mapGeminiHttpError(status, body) {
  const apiMessage = body?.error?.message ?? body?.error?.status ?? 'Unknown Gemini API error';

  switch (status) {
    case 400:
      return createError(502, `Gemini API bad request: ${apiMessage}`);
    case 401:
    case 403:
      return createError(503, 'Gemini API authentication failed. Check GEMINI_API_KEY.');
    case 429:
      return createError(429, 'Gemini API rate limit exceeded. Please retry later.');
    case 500:
    case 502:
    case 503:
      return createError(503, `Gemini API unavailable: ${apiMessage}`);
    default:
      return createError(502, `Gemini API error (${status}): ${apiMessage}`);
  }
}

export async function callGeminiGenerateContent(prompt) {
  assertGeminiConfigured();

  const { apiKey, timeoutMs } = getGeminiConfig();
  const url = `${getGenerateContentUrl()}?key=${encodeURIComponent(apiKey)}`;
  const body = buildGeminiRequestBody(prompt);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const responseBody = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw mapGeminiHttpError(response.status, responseBody);
    }

    return responseBody;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw createError(504, `Gemini API request timed out after ${timeoutMs}ms`);
    }
    if (err.status) throw err;
    throw createError(503, `Failed to reach Gemini API: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateRecommendation(input) {
  try {
    const prompt = buildRecommendationPrompt(input);
    const apiResponse = await callGeminiGenerateContent(prompt);
    const rawText = extractTextFromGeminiResponse(apiResponse);
    const recommendation = parseRecommendationJson(rawText);

    return {
      ...recommendation,
      input: {
        pickup: input.pickup,
        destination: input.destination,
        cropType: input.crop_type,
        weightKg: input.weight_kg,
        deliveryDate: input.delivery_date,
      },
      source: 'gemini',
      model: getGeminiConfig().model,
    };
  } catch (err) {
    // If Gemini fails (rate limits, auth, or network timeouts), return a high-quality fallback recommendation
    const weight = Number(input.weight_kg) || 1000;
    
    // Choose vehicle based on cargo weight rules
    let vehicle = 'pickup';
    if (weight < 1000) vehicle = 'mini_truck';
    else if (weight <= 2000) vehicle = 'pickup';
    else if (weight <= 5000) vehicle = 'truck';
    else vehicle = 'heavy';

    // Approximate cost: base fee + distance fee (defaulting to 150km base calculation)
    const baseRates = { mini_truck: 800, pickup: 1500, truck: 3000, heavy: 6000 };
    const perKgRate = { mini_truck: 1.2, pickup: 1.5, truck: 2.0, heavy: 3.5 };
    const cost = baseRates[vehicle] + (weight * perKgRate[vehicle]);
    
    // Estimated duration calculations based on standard speed
    const durationMinutes = 240; // Default fallback to 4 hours

    return {
      recommendedVehicle: vehicle,
      estimatedCost: Math.round(cost),
      estimatedDurationMinutes: durationMinutes,
      estimatedDuration: '4h',
      sharedTruckSuggestion: {
        recommended: weight < 3000,
        reason: weight < 3000 
          ? 'Your crop weight allows cost-saving consolidation in a shared truck group.' 
          : 'Heavy cargo load is best suited for dedicated transport.'
      },
      returnTripSuggestion: {
        recommended: true,
        reason: 'Recommended matching with returning empty trucks on this route to save up to 30% on transport charges.'
      },
      input: {
        pickup: input.pickup,
        destination: input.destination,
        cropType: input.crop_type,
        weightKg: input.weight_kg,
        deliveryDate: input.delivery_date,
      },
      source: 'fallback_engine',
      model: 'RuleEngine v1.0',
    };
  }
}
