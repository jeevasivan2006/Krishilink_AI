import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import * as farmerService from '../services/farmerService.js';

export const getDashboard = async (req, res) => {
  try {
    const data = await farmerService.getDashboard(req.user.id);
    return successResponse(res, data);
  } catch (err) {
    return errorResponse(res, err);
  }
};

export const getProfile = async (req, res) => {
  try {
    const data = await farmerService.getProfile(req.user.id);
    return successResponse(res, data);
  } catch (err) {
    return errorResponse(res, err);
  }
};

export const bookTransport = async (req, res) => {
  try {
    const result = await farmerService.bookTransport(req.user.id, req.body);
    return successResponse(res, result, 201);
  } catch (err) {
    return errorResponse(res, err);
  }
};

export const getBookingHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const data = await farmerService.getBookingHistory(req.user.id, { page, limit, search });
    return successResponse(res, data);
  } catch (err) {
    return errorResponse(res, err);
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = await farmerService.cancelBooking(req.user.id, bookingId);
    return successResponse(res, result);
  } catch (err) {
    return errorResponse(res, err);
  }
};

export const getEstimatedCost = async (req, res) => {
  try {
    const params = {
      distance_km: Number(req.query.distance_km || req.body?.distance_km || 0),
      vehicle_type: req.query.vehicle_type || req.body?.vehicle_type || 'standard',
    };
    const estimate = await farmerService.getEstimatedCost(params);
    return successResponse(res, estimate);
  } catch (err) {
    return errorResponse(res, err);
  }
};

export const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const data = await farmerService.getBookingDetails(req.user.id, bookingId);
    return successResponse(res, data);
  } catch (err) {
    return errorResponse(res, err);
  }
};
