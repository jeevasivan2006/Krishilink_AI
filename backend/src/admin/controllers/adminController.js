import * as dashboardService from '../services/dashboardService.js';
import * as userService from '../services/userService.js';
import * as driverService from '../services/driverService.js';
import * as bookingAdminService from '../services/bookingAdminService.js';
import * as analyticsService from '../services/analyticsService.js';
import * as revenueService from '../services/revenueService.js';
import * as reportService from '../services/reportService.js';
import * as monitoringService from '../services/monitoringService.js';
import { getAdminProfile } from '../validators/adminValidators.js';
import { success, created } from '../../utils/apiResponse.js';

export const getMe = async (req, res) => success(res, getAdminProfile(req), 'Admin profile');
export const getDashboard = async (_req, res) => success(res, await dashboardService.getDashboard(), 'Dashboard data');

export const listUsers = async (req, res) => success(res, await userService.listUsers(req.query), 'Users retrieved');
export const getUser = async (req, res) => success(res, await userService.getUserById(req.params.userId), 'User retrieved');
export const createUser = async (req, res) => created(res, await userService.createUser(req.user.id, req.body), 'User created');
export const updateUser = async (req, res) => success(res, await userService.updateUser(req.user.id, req.params.userId, req.body), 'User updated');
export const deleteUser = async (req, res) => success(res, await userService.deleteUser(req.user.id, req.params.userId), 'User deleted');

export const listDrivers = async (req, res) => success(res, await driverService.listDrivers(req.query), 'Drivers retrieved');
export const getDriver = async (req, res) => success(res, await driverService.getDriverById(req.params.driverId), 'Driver retrieved');
export const updateDriver = async (req, res) => success(res, await driverService.updateDriver(req.user.id, req.params.driverId, req.body), 'Driver updated');

export const listBookings = async (req, res) => success(res, await bookingAdminService.listBookings(req.query), 'Bookings retrieved');
export const getBooking = async (req, res) => success(res, await bookingAdminService.getBookingById(req.params.bookingId), 'Booking retrieved');
export const updateBookingStatus = async (req, res) => success(res, await bookingAdminService.updateBookingStatus(req.user.id, req.params.bookingId, req.body), 'Booking status updated');

export const getAnalytics = async (req, res) => success(res, await analyticsService.getAnalyticsOverview(req.query), 'Analytics overview');
export const getBookingsAnalytics = async (req, res) => success(res, await analyticsService.getBookingsAnalytics(req.query), 'Bookings analytics');

export const getRevenue = async (req, res) => success(res, await revenueService.getRevenueSummary(req.query), 'Revenue summary');

export const getBookingsReport = async (req, res) => success(res, await reportService.generateBookingsReport(req.query), 'Bookings report');
export const getRevenueReport = async (req, res) => success(res, await reportService.generateRevenueReport(req.query), 'Revenue report');
export const getUsersReport = async (req, res) => success(res, await reportService.generateUsersReport(), 'Users report');

export const getMonitoring = async (req, res) => success(res, await monitoringService.getBookingMonitoring(req.query), 'Booking monitoring');
export const getMonitoringDetail = async (req, res) => success(res, await monitoringService.getBookingMonitoringDetail(req.params.bookingId), 'Booking monitoring detail');
export const getActiveTrips = async (_req, res) => success(res, await monitoringService.getActiveTrips(), 'Active trips');
export const getAttentionRequired = async (_req, res) => success(res, await monitoringService.getAttentionRequired(), 'Attention required bookings');
