import * as returnTripService from '../services/returnTripService.js';
import { created, success } from '../../utils/apiResponse.js';

export const recordCompletion = async (req, res) => {
  const result = await returnTripService.recordDeliveryCompletion(req.user.id, req.body);
  return created(res, result, 'Delivery completion recorded');
};

export const getAvailability = async (req, res) => {
  const driverId = req.params.driverId ?? req.user.id;
  const availability = await returnTripService.getDriverAvailability(driverId);
  return success(res, availability, 'Driver availability retrieved');
};

export const findNearby = async (req, res) => {
  const result = await returnTripService.findNearbyForCompletion(req.params.completionId, {
    driverId: req.user.id,
  });
  return success(res, result, 'Nearby booking requests found');
};

export const generateSuggestions = async (req, res) => {
  const result = await returnTripService.generateSuggestions(req.params.completionId, req.user.id);
  return success(res, result, 'Return trip suggestions generated');
};

export const listSuggestions = async (req, res) => {
  const result = await returnTripService.listSuggestions({
    driverId: req.user.role === 'driver' ? req.user.id : undefined,
    farmerId: req.user.role === 'farmer' ? req.user.id : undefined,
    completionId: req.query.completion_id,
    status: req.query.status,
    page: req.query.page,
    limit: req.query.limit,
  });
  return success(res, result, 'Return trip suggestions retrieved');
};

export const acceptSuggestion = async (req, res) => {
  const result = await returnTripService.acceptReturnTrip(req.params.suggestionId, req.user.id);
  return success(res, result, 'Return trip accepted');
};

export const rejectSuggestion = async (req, res) => {
  const result = await returnTripService.rejectReturnTrip(req.params.suggestionId, req.user.id, {
    reason: req.body?.reason,
  });
  return success(res, result, 'Return trip rejected');
};

export const getHistory = async (req, res) => {
  const result = await returnTripService.getTripHistory({
    driverId: req.user.id,
    status: req.query.status,
    page: req.query.page,
    limit: req.query.limit,
  });
  return success(res, result, 'Return trip history retrieved');
};

export const completeTrip = async (req, res) => {
  const result = await returnTripService.completeReturnTrip(req.params.returnTripId, req.user.id);
  return success(res, result, 'Return trip completed');
};
