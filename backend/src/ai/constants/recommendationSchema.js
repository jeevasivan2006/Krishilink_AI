export const VEHICLE_TYPES = [
  'pickup',
  'mini_truck',
  'medium_truck',
  'heavy_truck',
  'refrigerated_truck',
];

export const RECOMMENDATION_JSON_SCHEMA = {
  recommended_vehicle: 'string',
  estimated_cost_inr: 'number',
  estimated_duration_minutes: 'number',
  shared_truck_suggestion: {
    recommended: 'boolean',
    reason: 'string',
  },
  return_trip_suggestion: {
    recommended: 'boolean',
    reason: 'string',
  },
};
