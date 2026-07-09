export const NOTIFICATION_CATEGORY = {
  BOOKING: 'booking',
  TRIP: 'trip',
  RETURN_TRIP: 'return_trip',
  SHARED_TRUCK: 'shared_truck',
};

export const NOTIFICATION_CHANNEL = {
  SMS: 'sms',
  EMAIL: 'email',
  PUSH: 'push',
};

export const NOTIFICATION_STATUS = {
  QUEUED: 'queued',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

export const BOOKING_EVENTS = {
  CREATED: 'booking.created',
  STATUS_CHANGED: 'booking.status_changed',
  CANCELLED: 'booking.cancelled',
  DRIVER_ASSIGNED: 'booking.driver_assigned',
  DELIVERED: 'booking.delivered',
};

export const TRIP_EVENTS = {
  STARTED: 'trip.started',
  PICKUP_STARTED: 'trip.pickup_started',
  IN_TRANSIT: 'trip.in_transit',
  ETA_UPDATED: 'trip.eta_updated',
  COMPLETED: 'trip.completed',
  LOCATION_UPDATED: 'trip.location_updated',
};

export const RETURN_TRIP_EVENTS = {
  SUGGESTION_CREATED: 'return_trip.suggestion_created',
  SUGGESTION_ACCEPTED: 'return_trip.suggestion_accepted',
  SUGGESTION_REJECTED: 'return_trip.suggestion_rejected',
  DRIVER_AVAILABLE: 'return_trip.driver_available',
  MATCH_FOUND: 'return_trip.match_found',
};

export const SHARED_TRUCK_EVENTS = {
  GROUP_CREATED: 'shared_truck.group_created',
  MEMBER_JOINED: 'shared_truck.member_joined',
  MEMBER_LEFT: 'shared_truck.member_left',
  GROUP_FULL: 'shared_truck.group_full',
  COST_UPDATED: 'shared_truck.cost_updated',
  MATCH_FOUND: 'shared_truck.match_found',
};

export const DEFAULT_SENDER = {
  sms: process.env.NOTIFICATION_SMS_SENDER_ID || 'KRISHILK',
  email: {
    name: process.env.NOTIFICATION_EMAIL_FROM_NAME || 'KrishiLink',
    address: process.env.NOTIFICATION_EMAIL_FROM || 'noreply@krishilink.in',
  },
  push: {
    appId: process.env.NOTIFICATION_PUSH_APP_ID || 'krishilink-app',
  },
};

export const SMS_MAX_LENGTH = 160;
