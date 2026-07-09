/**
 * Application route constants — single source of truth.
 * Use these everywhere instead of raw strings.
 */
export const ROUTES = {
  // Public
  HOME:        '/',
  CHOOSE_ROLE: '/choose-role',
  LOGIN:       '/login',
  FARMER_LOGIN:  '/login/farmer',
  DRIVER_LOGIN:  '/login/driver',
  ADMIN_LOGIN_PAGE: '/login/admin',
  REGISTER:    '/register',
  FARMER_REGISTER: '/register/farmer',
  DRIVER_REGISTER: '/register/driver',

  // Farmer
  FARMER_DASHBOARD: '/farmer/dashboard',
  FARMER_BOOKINGS:  '/farmer/bookings',
  FARMER_BOOKING_NEW: '/farmer/bookings/new',
  FARMER_BOOKING_DETAIL: (id = ':id') => `/farmer/bookings/${id}`,
  FARMER_PROFILE:   '/farmer/profile',

  // Driver
  BOOKING: '/booking',
  DRIVER_DASHBOARD: '/driver/dashboard',
  DRIVER_TRIPS:     '/driver/trips',
  DRIVER_TRIP_DETAIL: (id = ':id') => `/driver/trips/${id}`,
  DRIVER_MARKETPLACE: '/driver/marketplace',
  DRIVER_PROFILE:   '/driver/profile',

  // Shared
  TRACKING:   (id = ':id') => `/tracking/${id}`,
  NOTIFICATIONS: '/notifications',

  // Admin
  ADMIN_LOGIN:     '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS:     '/admin/users',
  ADMIN_BOOKINGS:  '/admin/bookings',
  ADMIN_DRIVERS:   '/admin/drivers',
  ADMIN_ANALYTICS: '/admin/analytics',

  // Misc
  SHARED_TRUCKS:     '/shared-trucks',
  RETURN_TRIPS:      '/return-trips',
  AI_RECOMMENDATION: '/ai-recommendation',
  BOOKING_HISTORY:   '/booking-history',
  NOT_FOUND: '*',
  ERROR:     '/error',
  UNAUTHORIZED: '/unauthorized',
};

export const ROLE_HOME_MAP = {
  farmer: ROUTES.FARMER_DASHBOARD,
  driver: ROUTES.DRIVER_DASHBOARD,
  admin:  ROUTES.ADMIN_DASHBOARD,
};
