import { Router } from 'express';
import asyncWrapper from '../../middlewares/asyncWrapper.js';
import authenticate from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { PERMISSIONS } from '../constants/roles.js';

// ── Controllers ─────────────────────────────────────────────────
import * as authCtrl from '../controllers/authController.js';
import * as adminCtrl from '../controllers/adminController.js';

// ── Validators ──────────────────────────────────────────────────
import { validateLogin, validateRefreshToken, validateChangePassword, validateRegister } from '../validators/authValidators.js';

import {
  validateListUsers,
  validateUserId,
  validateCreateUser,
  validateUpdateUser,
  validateListDrivers,
  validateDriverId,
  validateUpdateDriver,
  validateListBookings,
  validateBookingId,
  validateUpdateBookingStatus,
  validatePeriod,
  validateAnalyticsQuery,
  validateMonitoringQuery,
} from '../validators/adminValidators.js';

const router = Router();

// ╔══════════════════════════════════════════════════════════════════╗
// ║  AUTH — public (no auth middleware)                              ║
// ╚══════════════════════════════════════════════════════════════════╝

router.post('/auth/register', validateRegister, asyncWrapper(authCtrl.registerUser));
router.post('/auth/login', validateLogin, asyncWrapper(authCtrl.login));
router.post('/auth/refresh', validateRefreshToken, asyncWrapper(authCtrl.refresh));


// ╔══════════════════════════════════════════════════════════════════╗
// ║  AUTH — protected (require auth)                                ║
// ╚══════════════════════════════════════════════════════════════════╝

router.post('/auth/change-password', authenticate, validateChangePassword, asyncWrapper(authCtrl.changePassword));
router.post('/auth/logout', authenticate, asyncWrapper(authCtrl.logoutHandler));
router.get('/auth/me', authenticate, asyncWrapper(authCtrl.getMe));

// ╔══════════════════════════════════════════════════════════════════╗
// ║  All routes below require authentication + admin role           ║
// ╚══════════════════════════════════════════════════════════════════╝

// ── Dashboard ───────────────────────────────────────────────────
router.get(
  '/dashboard',
  authenticate,
  authorize(PERMISSIONS.DASHBOARD_VIEW),
  asyncWrapper(adminCtrl.getDashboard),
);

// ── Users CRUD ──────────────────────────────────────────────────
router.get(
  '/users',
  authenticate,
  authorize(PERMISSIONS.USERS_LIST),
  validateListUsers,
  asyncWrapper(adminCtrl.listUsers),
);

router.get(
  '/users/:userId',
  authenticate,
  authorize(PERMISSIONS.USERS_VIEW),
  validateUserId,
  asyncWrapper(adminCtrl.getUser),
);

router.post(
  '/users',
  authenticate,
  authorize(PERMISSIONS.USERS_CREATE),
  validateCreateUser,
  asyncWrapper(adminCtrl.createUser),
);

router.put(
  '/users/:userId',
  authenticate,
  authorize(PERMISSIONS.USERS_UPDATE),
  validateUserId,
  validateUpdateUser,
  asyncWrapper(adminCtrl.updateUser),
);

router.delete(
  '/users/:userId',
  authenticate,
  authorize(PERMISSIONS.USERS_DELETE),
  validateUserId,
  asyncWrapper(adminCtrl.deleteUser),
);

// ── Drivers ─────────────────────────────────────────────────────
router.get(
  '/drivers',
  authenticate,
  authorize(PERMISSIONS.DRIVERS_LIST),
  validateListDrivers,
  asyncWrapper(adminCtrl.listDrivers),
);

router.get(
  '/drivers/:driverId',
  authenticate,
  authorize(PERMISSIONS.DRIVERS_VIEW),
  validateDriverId,
  asyncWrapper(adminCtrl.getDriver),
);

router.put(
  '/drivers/:driverId',
  authenticate,
  authorize(PERMISSIONS.DRIVERS_UPDATE),
  validateDriverId,
  validateUpdateDriver,
  asyncWrapper(adminCtrl.updateDriver),
);

// ── Bookings ────────────────────────────────────────────────────
router.get(
  '/bookings',
  authenticate,
  authorize(PERMISSIONS.BOOKINGS_LIST),
  validateListBookings,
  asyncWrapper(adminCtrl.listBookings),
);

router.get(
  '/bookings/:bookingId',
  authenticate,
  authorize(PERMISSIONS.BOOKINGS_VIEW),
  validateBookingId,
  asyncWrapper(adminCtrl.getBooking),
);

router.patch(
  '/bookings/:bookingId/status',
  authenticate,
  authorize(PERMISSIONS.BOOKINGS_UPDATE),
  validateBookingId,
  validateUpdateBookingStatus,
  asyncWrapper(adminCtrl.updateBookingStatus),
);

// ── Analytics ───────────────────────────────────────────────────
router.get(
  '/analytics',
  authenticate,
  authorize(PERMISSIONS.ANALYTICS_VIEW),
  validatePeriod,
  asyncWrapper(adminCtrl.getAnalytics),
);

router.get(
  '/analytics/bookings',
  authenticate,
  authorize(PERMISSIONS.ANALYTICS_VIEW),
  validateAnalyticsQuery,
  asyncWrapper(adminCtrl.getBookingsAnalytics),
);

// ── Revenue ─────────────────────────────────────────────────────
router.get(
  '/revenue',
  authenticate,
  authorize(PERMISSIONS.REVENUE_VIEW),
  validatePeriod,
  asyncWrapper(adminCtrl.getRevenue),
);

// ── Reports ─────────────────────────────────────────────────────
router.get(
  '/reports/bookings',
  authenticate,
  authorize(PERMISSIONS.REPORTS_VIEW),
  validatePeriod,
  asyncWrapper(adminCtrl.getBookingsReport),
);

router.get(
  '/reports/revenue',
  authenticate,
  authorize(PERMISSIONS.REPORTS_VIEW),
  validatePeriod,
  asyncWrapper(adminCtrl.getRevenueReport),
);

router.get(
  '/reports/users',
  authenticate,
  authorize(PERMISSIONS.REPORTS_VIEW),
  asyncWrapper(adminCtrl.getUsersReport),
);

// ── Booking Monitoring ──────────────────────────────────────────
router.get(
  '/monitoring',
  authenticate,
  authorize(PERMISSIONS.MONITORING_VIEW),
  validateMonitoringQuery,
  asyncWrapper(adminCtrl.getMonitoring),
);

router.get(
  '/monitoring/active-trips',
  authenticate,
  authorize(PERMISSIONS.MONITORING_VIEW),
  asyncWrapper(adminCtrl.getActiveTrips),
);

router.get(
  '/monitoring/attention',
  authenticate,
  authorize(PERMISSIONS.MONITORING_VIEW),
  asyncWrapper(adminCtrl.getAttentionRequired),
);

router.get(
  '/monitoring/:bookingId',
  authenticate,
  authorize(PERMISSIONS.MONITORING_VIEW),
  validateBookingId,
  asyncWrapper(adminCtrl.getMonitoringDetail),
);

export default router;
