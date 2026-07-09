import { VEHICLE_TYPES } from '../constants/recommendationSchema.js';

export function buildRecommendationPrompt(input) {
  const { pickup, destination, crop_type, weight_kg, delivery_date } = input;

  return `You are a logistics advisor for KrishiLink, an Indian farm produce transportation platform.

Analyze this shipment request and respond with ONLY valid JSON (no markdown, no code fences).

Shipment details:
- Pickup: ${pickup}
- Destination: ${destination}
- Crop type: ${crop_type}
- Weight: ${weight_kg} kg
- Delivery date: ${delivery_date}

Return JSON in this exact shape:
{
  "recommended_vehicle": "<one of: ${VEHICLE_TYPES.join(', ')}>",
  "estimated_cost_inr": <number, estimated total cost in Indian Rupees>,
  "estimated_duration_minutes": <number, estimated travel duration in minutes>,
  "shared_truck_suggestion": {
    "recommended": <boolean>,
    "reason": "<short explanation>"
  },
  "return_trip_suggestion": {
    "recommended": <boolean>,
    "reason": "<short explanation>"
  }
}

Rules:
- Choose vehicle based on weight: pickup (<500kg), mini_truck (500-1500kg), medium_truck (1500-5000kg), heavy_truck (>5000kg), refrigerated_truck for perishable crops (vegetables, fruits, dairy, flowers).
- Estimate cost using typical Indian road freight rates (₹15-25/km for small loads, ₹8-15/km for full truck loads). Use approximate distance between pickup and destination cities.
- Estimate duration based on road distance at average 40-50 km/h including loading time.
- Recommend shared truck when weight is under 60% of typical truck capacity for the route.
- Recommend return trip when destination is a major market hub where empty return trucks are common.
- All cost values must be positive numbers. Duration must be at least 30 minutes.`;
}

export function buildGeminiRequestBody(prompt) {
  return {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  };
}
