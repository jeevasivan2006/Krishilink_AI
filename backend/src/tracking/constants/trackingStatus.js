export const TRACKING_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
};

export const TRACKABLE_BOOKING_STATUSES = [
  'accepted',
  'pickup_started',
  'in_transit',
];

export const DEFAULT_AVG_SPEED_KMH = Number(process.env.TRACKING_DEFAULT_SPEED_KMH) || 45;
export const MIN_ETA_MINUTES = 5;
