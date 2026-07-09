import * as bookingService from '../services/bookingService.js';
import * as sharedMatchingService from '../../sharedMatching/services/sharedMatchingService.js';
import { created, success } from '../../utils/apiResponse.js';

export const createBooking = async (req, res) => {
  const booking = await bookingService.createBooking(req.user.id, req.body);

  let sharedMatch = null;
  if (booking.wants_shared && booking.cargo_weight_kg) {
    sharedMatch = await sharedMatchingService.autoMatchBooking(booking.id, {
      farmerId: req.user.id,
      actorId: req.user.id,
    });
  }

  return created(res, { booking, sharedMatch }, 'Booking created');
};

export const listBookings = async (req, res) => {
  const { page, limit, status, search } = req.query;
  const result = await bookingService.listBookings({
    farmerId: req.user.id,
    status,
    search,
    page,
    limit,
  });
  return success(res, result, 'Bookings retrieved');
};

export const getBooking = async (req, res) => {
  const booking = await bookingService.getBookingById(req.params.id, {
    farmerId: req.user.id,
  });
  return success(res, booking, 'Booking retrieved');
};

export const updateBooking = async (req, res) => {
  const booking = await bookingService.updateBooking(
    req.params.id,
    req.user.id,
    req.body,
  );
  return success(res, booking, 'Booking updated');
};

export const updateBookingStatus = async (req, res) => {
  const { status, note, vehicle_id, driver_id, final_cost, metadata } = req.body;
  const booking = await bookingService.updateBookingStatus(req.params.id, status, {
    actorId: req.user.id,
    note,
    vehicleId: vehicle_id,
    driverId: driver_id,
    finalCost: final_cost,
    metadata,
  });
  return success(res, booking, 'Booking status updated');
};

export const cancelBooking = async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, {
    farmerId: req.user.id,
    actorId: req.user.id,
    note: req.body?.note,
  });
  return success(res, booking, 'Booking cancelled');
};

export const getBookingTimeline = async (req, res) => {
  const timeline = await bookingService.getBookingTimeline(req.params.id, {
    farmerId: req.user.id,
  });
  return success(res, { timeline }, 'Booking timeline retrieved');
};
