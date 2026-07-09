import Joi from 'joi';
import { clientError } from '../../utils/apiResponse.js';
import {
  NOTIFICATION_CATEGORY,
  BOOKING_EVENTS,
  TRIP_EVENTS,
  RETURN_TRIP_EVENTS,
  SHARED_TRUCK_EVENTS,
  NOTIFICATION_CHANNEL,
} from '../constants/notificationTypes.js';

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

const recipientSchema = Joi.object({
  phone: Joi.string().trim().max(20).optional(),
  email: Joi.string().email().optional(),
  deviceToken: Joi.string().trim().max(500).optional(),
}).or('phone', 'email', 'deviceToken');

const channelsSchema = Joi.array()
  .items(Joi.string().valid(...Object.values(NOTIFICATION_CHANNEL)))
  .optional();

const contextSchema = Joi.object().unknown(true);

const baseSendSchema = {
  user_id: Joi.string().uuid().required(),
  event_type: Joi.string().required(),
  context: contextSchema.required(),
  recipient: recipientSchema.required(),
  channels: channelsSchema,
};

export const validateBookingNotification = validate(
  Joi.object({
    ...baseSendSchema,
    event_type: Joi.string().valid(...Object.values(BOOKING_EVENTS)).required(),
  }),
);

export const validateTripNotification = validate(
  Joi.object({
    ...baseSendSchema,
    event_type: Joi.string().valid(...Object.values(TRIP_EVENTS)).required(),
  }),
);

export const validateReturnTripAlert = validate(
  Joi.object({
    ...baseSendSchema,
    event_type: Joi.string().valid(...Object.values(RETURN_TRIP_EVENTS)).required(),
  }),
);

export const validateSharedTruckAlert = validate(
  Joi.object({
    ...baseSendSchema,
    event_type: Joi.string().valid(...Object.values(SHARED_TRUCK_EVENTS)).required(),
  }),
);

export const validatePreview = validate(
  Joi.object({
    category: Joi.string()
      .valid(...Object.values(NOTIFICATION_CATEGORY))
      .required(),
    event_type: Joi.string().required(),
    context: contextSchema.required(),
    recipient: recipientSchema.optional(),
  }),
);

export const validateListQuery = validate(
  Joi.object({
    category: Joi.string().valid(...Object.values(NOTIFICATION_CATEGORY)).optional(),
    unread_only: Joi.boolean().default(false),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
  'query',
);

export const validateNotificationId = validate(
  Joi.object({ id: Joi.string().uuid().required() }),
  'params',
);
