export const COMPLETION_STATUS = {
  AVAILABLE: 'available',
  MATCHED: 'matched',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
};

export const SUGGESTION_STATUS = {
  SUGGESTED: 'suggested',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

export const RETURN_TRIP_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const MATCHABLE_BOOKING_STATUSES = [
  'pending',
  'searching_truck',
  'shared_matching',
];

export const DEFAULT_SEARCH_RADIUS_KM = Number(process.env.RETURN_TRIP_SEARCH_RADIUS_KM) || 50;
export const MAX_SUGGESTIONS = Number(process.env.RETURN_TRIP_MAX_SUGGESTIONS) || 10;
export const SUGGESTION_TTL_HOURS = Number(process.env.RETURN_TRIP_SUGGESTION_TTL_HOURS) || 24;
export const COMPLETION_TTL_HOURS = Number(process.env.RETURN_TRIP_COMPLETION_TTL_HOURS) || 48;
