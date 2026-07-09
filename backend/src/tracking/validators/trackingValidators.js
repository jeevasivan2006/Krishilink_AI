import Joi from 'joi';
import { clientError } from '../../utils/apiResponse.js';

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

const lat = Joi.number().min(-90).max(90);
const lng = Joi.number().min(-180).max(180);
const uuidParam = name => Joi.object({ [name]: Joi.string().uuid().required() });

const waypointSchema = Joi.object({
  lat: lat.required(),
  lng: lng.required(),
  label: Joi.string().trim().max(200).optional(),
  sequence: Joi.number().integer().min(0).optional(),
});

export const validateDriverId = validate(uuidParam('driverId'), 'params');
export const validateBookingId = validate(uuidParam('bookingId'), 'params');

export const validateUpdateLocation = validate(
  Joi.object({
    lat: lat.required(),
    lng: lng.required(),
    heading: Joi.number().min(0).max(360).optional(),
    speed_kmh: Joi.number().min(0).max(200).optional(),
    accuracy_m: Joi.number().min(0).optional(),
    booking_id: Joi.string().uuid().optional(),
    recorded_at: Joi.date().iso().optional(),
  }),
  'body',
);

export const validateStoreRoute = validate(
  Joi.object({
    origin_lat: lat.required(),
    origin_lng: lng.required(),
    destination_lat: lat.required(),
    destination_lng: lng.required(),
    waypoints: Joi.array().items(waypointSchema).max(50).default([]),
    encoded_polyline: Joi.string().max(10000).optional(),
  }),
  'body',
);

export const validateHistoryQuery = validate(
  Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(200).default(50),
  }),
  'query',
);
