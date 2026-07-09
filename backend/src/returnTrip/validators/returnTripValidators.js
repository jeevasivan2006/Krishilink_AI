import Joi from 'joi';
import { clientError } from '../../utils/apiResponse.js';
import {
  RETURN_TRIP_STATUS,
  SUGGESTION_STATUS,
} from '../constants/returnTripStatus.js';

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

const uuidParam = name => Joi.object({ [name]: Joi.string().uuid().required() });

const latSchema = Joi.number().min(-90).max(90);
const lngSchema = Joi.number().min(-180).max(180);

export const validateCompletionId = validate(uuidParam('completionId'), 'params');
export const validateSuggestionId = validate(uuidParam('suggestionId'), 'params');
export const validateReturnTripId = validate(uuidParam('returnTripId'), 'params');
export const validateDriverId = validate(uuidParam('driverId'), 'params');

const recordCompletionSchema = Joi.object({
  booking_id: Joi.string().uuid().required(),
  vehicle_id: Joi.string().uuid().optional(),
  current_lat: latSchema.required(),
  current_lng: lngSchema.required(),
  current_location: Joi.string().trim().max(500).optional(),
  delivery_destination: Joi.string().trim().max(500).optional(),
  delivery_lat: latSchema.optional(),
  delivery_lng: lngSchema.optional(),
  return_destination: Joi.string().trim().max(500).optional(),
  return_lat: latSchema.optional(),
  return_lng: lngSchema.optional(),
  search_radius_km: Joi.number().precision(2).min(1).max(200).default(50),
});

const rejectSchema = Joi.object({
  reason: Joi.string().trim().max(500).optional(),
});

const listSuggestionsSchema = Joi.object({
  completion_id: Joi.string().uuid().optional(),
  status: Joi.string().valid(...Object.values(SUGGESTION_STATUS)).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const historySchema = Joi.object({
  status: Joi.string().valid(...Object.values(RETURN_TRIP_STATUS)).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const validateRecordCompletion = validate(recordCompletionSchema, 'body');
export const validateReject = validate(rejectSchema, 'body');
export const validateListSuggestions = validate(listSuggestionsSchema, 'query');
export const validateHistory = validate(historySchema, 'query');
