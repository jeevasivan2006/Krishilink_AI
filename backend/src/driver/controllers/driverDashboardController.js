import * as driverDashboardService from '../services/driverDashboardService.js';
import { success } from '../../utils/apiResponse.js';

export const getDashboard = async (req, res) => {
  const dashboard = await driverDashboardService.getDashboard(req.user.id);
  return success(res, dashboard, 'Driver dashboard retrieved');
};

export const acceptBooking = async (req, res) => {
  const booking = await driverDashboardService.acceptBooking(req.user.id, req.params.bookingId);
  return success(res, { booking }, 'Booking accepted');
};

export const rejectBooking = async (req, res) => {
  const result = await driverDashboardService.rejectBooking(req.user.id, req.params.bookingId, {
    reason: req.body?.reason,
  });
  return success(res, result, 'Booking rejected');
};

export const updateAvailability = async (req, res) => {
  const result = await driverDashboardService.updateAvailability(req.user.id, req.body?.availability);
  return success(res, result, 'Driver availability updated');
};
