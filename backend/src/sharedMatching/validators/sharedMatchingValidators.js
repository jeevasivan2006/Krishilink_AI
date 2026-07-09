import Joi from 'joi';
import { clientError } from '../../utils/apiResponse.js';
import { SHARED_GROUP_STATUS } from '../constants/sharedGroupStatus.js';

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

const uuidParam = (name) => Joi.object({ [name]: Joi.string().uuid().required() });

export const validateGroupId = validate(uuidParam('groupId'), 'params');
export const validateBookingIdParam = validate(uuidParam('bookingId'), 'params');
export const validateGroupAndBookingParams = validate(
  Joi.object({
    groupId: Joi.string().uuid().required(),
    bookingId: Joi.string().uuid().required(),
  }),
  'params',
);

const joinGroupSchema = Joi.object({
  truck_capacity_kg: Joi.number().precision(2).min(1).optional(),
  truck_id: Joi.string().uuid().optional(),
});

const listGroupsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string()
    .valid(...Object.values(SHARED_GROUP_STATUS))
    .optional(),
  date: Joi.date().iso().optional(),
  pickup: Joi.string().trim().max(500).optional(),
  destination: Joi.string().trim().max(500).optional(),
});

export const validateJoinGroup = validate(joinGroupSchema, 'body');
export const validateListGroups = validate(listGroupsSchema, 'query');
