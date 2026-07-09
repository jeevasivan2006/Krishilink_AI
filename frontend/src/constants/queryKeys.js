/**
 * TanStack Query key factory — keeps cache keys consistent and composable.
 */
export const queryKeys = {
  // Auth
  auth: {
    me: () => ['auth', 'me'],
  },

  // Bookings
  bookings: {
    all:    ()       => ['bookings'],
    lists:  ()       => ['bookings', 'list'],
    list:   (params) => ['bookings', 'list', params],
    detail: (id)     => ['bookings', 'detail', id],
  },

  // Drivers
  drivers: {
    all:    ()       => ['drivers'],
    lists:  ()       => ['drivers', 'list'],
    list:   (params) => ['drivers', 'list', params],
    detail: (id)     => ['drivers', 'detail', id],
    availability: (id) => ['drivers', 'availability', id],
  },

  // Tracking
  tracking: {
    live: (bookingId) => ['tracking', 'live', bookingId],
    history: (bookingId) => ['tracking', 'history', bookingId],
  },

  // Notifications
  notifications: {
    all:    ()       => ['notifications'],
    unread: ()       => ['notifications', 'unread'],
  },

  // Marketplace
  marketplace: {
    listings: (params) => ['marketplace', 'listings', params],
    detail:   (id)     => ['marketplace', 'detail', id],
  },

  // Analytics (admin)
  analytics: {
    dashboard: (range) => ['analytics', 'dashboard', range],
    revenue:   (range) => ['analytics', 'revenue', range],
  },

  // Admin users/drivers
  adminUsers:    { list: (params) => ['admin', 'users', params] },
  adminDrivers:  { list: (params) => ['admin', 'drivers', params] },
  adminBookings: { list: (params) => ['admin', 'bookings', params] },
};
