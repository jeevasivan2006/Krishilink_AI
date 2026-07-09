export * from './routes';
export * from './queryKeys';

/* ── App-wide constants ─────────────────────────────────────────── */
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'KrishiLink';

export const USER_ROLES = {
  FARMER: 'farmer',
  DRIVER: 'driver',
  ADMIN:  'admin',
};

export const BOOKING_STATUS = {
  PENDING:    'pending',
  CONFIRMED:  'confirmed',
  IN_TRANSIT: 'in_transit',
  DELIVERED:  'delivered',
  CANCELLED:  'cancelled',
};

export const BOOKING_STATUS_LABEL = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  in_transit: 'In Transit',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
};

export const BOOKING_STATUS_COLOR = {
  pending:    'yellow',
  confirmed:  'blue',
  in_transit: 'green',
  delivered:  'green',
  cancelled:  'red',
};

export const VEHICLE_TYPES = [
  { value: 'mini_truck', label: 'Mini Truck (< 1 ton)' },
  { value: 'pickup',     label: 'Pickup (1–2 ton)' },
  { value: 'truck',      label: 'Truck (2–5 ton)' },
  { value: 'heavy',      label: 'Heavy Truck (> 5 ton)' },
];

export const PRODUCE_TYPES = [
  'Vegetables', 'Fruits', 'Grains', 'Pulses',
  'Dairy', 'Poultry', 'Flowers', 'Other',
];

export const PAGINATION_DEFAULTS = {
  page:     1,
  limit:    10,
  maxLimit: 100,
};

export const TOKEN_KEY    = 'krishilink_token';
export const USER_KEY     = 'krishilink_user';
export const THEME_KEY    = 'krishilink_theme';
