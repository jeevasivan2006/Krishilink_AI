import * as trackingService from '../services/trackingService.js';
import { created, success } from '../../utils/apiResponse.js';

export const updateLocation = async (req, res) => {
  const result = await trackingService.updateDriverLocation(req.user.id, req.body);
  return success(res, result, 'Location updated');
};

export const getDriverLocation = async (req, res) => {
  const location = await trackingService.getDriverLocation(req.params.driverId);
  return success(res, location, 'Driver location retrieved');
};

export const startTracking = async (req, res) => {
  const tracking = await trackingService.startBookingTracking(req.params.bookingId, req.user.id);
  return created(res, tracking, 'Booking tracking started');
};

export const storeRoute = async (req, res) => {
  const route = await trackingService.storeBookingRoute(req.params.bookingId, req.user.id, req.body);
  return success(res, route, 'Route stored');
};

export const getRoute = async (req, res) => {
  const route = await trackingService.getBookingRoute(req.params.bookingId, req.user.id, req.user.role);
  return success(res, route, 'Route retrieved');
};

export const getEta = async (req, res) => {
  const eta = await trackingService.getBookingEta(req.params.bookingId, req.user.id, req.user.role);
  return success(res, eta, 'ETA calculated');
};

export const getBookingTracking = async (req, res) => {
  const tracking = await trackingService.getBookingTracking(req.params.bookingId, req.user.id, req.user.role);
  return success(res, tracking, 'Booking tracking retrieved');
};

export const getHistory = async (req, res) => {
  const history = await trackingService.getLocationHistory(
    req.params.bookingId,
    req.user.id,
    req.user.role,
    req.query,
  );
  return success(res, history, 'Location history retrieved');
};

export const completeTracking = async (req, res) => {
  const tracking = await trackingService.completeBookingTracking(req.params.bookingId, req.user.id);
  return success(res, tracking, 'Tracking completed');
};
