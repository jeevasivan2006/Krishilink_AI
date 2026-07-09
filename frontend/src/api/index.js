/**
 * src/api/index.js — barrel export for the entire API layer
 *
 * Usage:
 *   import api from '@/api/api';                        // raw client
 *   import { createBooking } from '@/api';               // domain method
 *   import { ApiError, tokenStore } from '@/api/api';    // utilities
 */

// ── HTTP client & utilities ──────────────────────────────────────
export {
  default as api,
  default as axiosInstance,          // backward-compat alias for authService.js
  ApiError,
  tokenStore,
  onLoadingChange,
  isLoading,
  setGlobalErrorHandler,
} from './api';

// ── Auth ─────────────────────────────────────────────────────────
export {
  // Generic (all roles)
  login,
  register,
  logout,
  getMe,
  refreshToken,
  changePassword,
  storeSession,
  clearSession,
  getStoredUser,
  // Admin aliases
  adminLogin,
  adminRefreshToken,
  adminChangePassword,
  adminLogout,
  adminGetMe,
} from './auth.api';

// ── Bookings ─────────────────────────────────────────────────────
export {
  createBooking,
  listBookings,
  getBooking,
  getBookingTimeline,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
} from './bookings.api';

// ── Farmer ───────────────────────────────────────────────────────
export {
  getFarmerDashboard,
  getFarmerProfile,
  farmerBookTransport,
  getFarmerBookingHistory,
  getFarmerBookingDetail,
  farmerCancelBooking,
  getEstimatedCost,
} from './farmer.api';

// ── Driver ───────────────────────────────────────────────────────
export {
  getDriverDashboard,
  acceptBooking,
  rejectBooking,
} from './driver.api';

// ── Tracking ─────────────────────────────────────────────────────
export {
  updateLocation,
  getDriverLocation,
  startTracking,
  getBookingTracking,
  getEta,
  getLocationHistory,
  storeRoute,
  getRoute,
  completeTracking,
} from './tracking.api';

// ── Notifications ────────────────────────────────────────────────
export {
  listNotifications,
  getNotification,
  markNotificationRead,
  markAllNotificationsRead,
  previewNotification,
  sendBookingNotification,
  sendTripNotification,
  sendReturnTripAlert,
  sendSharedTruckAlert,
  getNotificationEventsUrl,
} from './notifications.api';

// ── Return-Trip Marketplace ──────────────────────────────────────
export {
  recordCompletion,
  getReturnTripAvailability,
  listSuggestions,
  acceptSuggestion,
  rejectSuggestion,
  findNearbyFarmers,
  generateSuggestions,
  getReturnTripHistory,
  completeReturnTrip,
} from './returnTrip.api';

// ── Shared Matching ──────────────────────────────────────────────
export {
  listSharedGroups,
  findGroupMatches,
  autoMatchBooking,
  getSharedGroup,
  getGroupCapacity,
  getGroupCostSplit,
  joinSharedGroup,
  leaveSharedGroup,
} from './sharedMatching.api';

// ── AI ───────────────────────────────────────────────────────────
export { getAiRecommendation } from './ai.api';

// ── Admin ────────────────────────────────────────────────────────
export {
  getAdminDashboard,
  listAdminUsers,
  getAdminUser,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  listAdminDrivers,
  getAdminDriver,
  updateAdminDriver,
  listAdminBookings,
  getAdminBooking,
  updateAdminBookingStatus,
  getAnalytics,
  getBookingsAnalytics,
  getRevenue,
  getBookingsReport,
  getRevenueReport,
  getUsersReport,
  getMonitoring,
  getActiveTrips,
  getAttentionRequired,
  getMonitoringDetail,
} from './admin.api';
