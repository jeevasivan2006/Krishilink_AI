import Joi from 'joi';
import { clientError } from '../../utils/apiResponse.js';
import { ALL_STATUSES } from '../constants/bookingStatus.js';

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      const message = error.details.map(d => d.message).join(', ');
      return clientError(res, message, 400);
    }
    req[source] = value;
    next();
  };
}

const locationSchema = Joi.string().trim().min(1).max(500);

const createBookingSchema = Joi.object({
  start_location: locationSchema.required(),
  end_location: locationSchema.required(),
  scheduled_at: Joi.date().iso().greater('now').required(),
  cargo_weight_kg: Joi.number().precision(2).min(0.01).optional(),
  wants_shared: Joi.boolean().default(true),
  vehicle_id: Joi.string().uuid().optional(),
  estimated_cost: Joi.number().precision(2).min(0).optional(),
  notes: Joi.string().trim().max(1000).optional(),
  start_lat: Joi.number().min(-90).max(90).optional(),
  start_lng: Joi.number().min(-180).max(180).optional(),
  end_lat: Joi.number().min(-90).max(90).optional(),
  end_lng: Joi.number().min(-180).max(180).optional(),
});

const updateBookingSchema = Joi.object({
  start_location: locationSchema.optional(),
  end_location: locationSchema.optional(),
  scheduled_at: Joi.date().iso().greater('now').optional(),
  vehicle_id: Joi.string().uuid().allow(null).optional(),
  estimated_cost: Joi.number().precision(2).min(0).allow(null).optional(),
  notes: Joi.string().trim().max(1000).allow(null).optional(),
  start_lat: Joi.number().min(-90).max(90).allow(null).optional(),
  start_lng: Joi.number().min(-180).max(180).allow(null).optional(),
  end_lat: Joi.number().min(-90).max(90).allow(null).optional(),
  end_lng: Joi.number().min(-180).max(180).allow(null).optional(),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...ALL_STATUSES)
    .required(),
  note: Joi.string().trim().max(500).optional(),
  vehicle_id: Joi.string().uuid().optional(),
  driver_id: Joi.string().uuid().optional(),
  final_cost: Joi.number().precision(2).min(0).optional(),
  metadata: Joi.object().optional(),
});

const listBookingsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string()
    .valid(...ALL_STATUSES)
    .optional(),
  search: Joi.string().trim().max(200).optional(),
});

const bookingIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const cancelBookingSchema = Joi.object({
  note: Joi.string().trim().max(500).optional(),
});

export const validateCreateBooking = validate(createBookingSchema, 'body');
export const validateUpdateBooking = validate(updateBookingSchema, 'body');
export const validateUpdateStatus = validate(updateStatusSchema, 'body');
export const validateListBookings = validate(listBookingsSchema, 'query');
export const validateBookingId = validate(bookingIdSchema, 'params');
export const validateCancelBooking = validate(cancelBookingSchema, 'body');
