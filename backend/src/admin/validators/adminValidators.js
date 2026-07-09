import Joi from 'joi';
import { clientError } from '../../utils/apiResponse.js';
import { ALL_STATUSES as BOOKING_STATUSES } from '../../booking/constants/bookingStatus.js';
import { ROLES, getPermissionsForRole } from '../constants/roles.js';

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

const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

const period = Joi.string().valid('7d', '30d', '90d', '1y').default('30d');
const uuidParam = name => Joi.object({ [name]: Joi.string().uuid().required() });

export const validateUserId = validate(uuidParam('userId'), 'params');
export const validateDriverId = validate(uuidParam('driverId'), 'params');
export const validateBookingId = validate(uuidParam('bookingId'), 'params');

export const validateListUsers = validate(
  Joi.object({
    ...pagination,
    role: Joi.string().valid(...Object.values(ROLES)).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').optional(),
    search: Joi.string().trim().max(200).optional(),
  }),
  'query',
);

export const validateCreateUser = validate(
  Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().trim().max(20).optional(),
    role: Joi.string().valid(...Object.values(ROLES)).required(),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').default('active'),
  }),
);

export const validateUpdateUser = validate(
  Joi.object({
    name: Joi.string().trim().min(1).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().trim().max(20).allow(null).optional(),
    role: Joi.string().valid(...Object.values(ROLES)).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').optional(),
  }).min(1),
);

export const validateListDrivers = validate(
  Joi.object({
    ...pagination,
    availability: Joi.string().valid('available', 'busy', 'offline').optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').optional(),
    search: Joi.string().trim().max(200).optional(),
  }),
  'query',
);

export const validateUpdateDriver = validate(
  Joi.object({
    name: Joi.string().trim().min(1).max(100).optional(),
    phone: Joi.string().trim().max(20).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').optional(),
    license_number: Joi.string().trim().max(50).optional(),
    vehicle_type: Joi.string().trim().max(50).optional(),
    vehicle_number: Joi.string().trim().max(20).optional(),
    availability: Joi.string().valid('available', 'busy', 'offline').optional(),
    rating: Joi.number().min(0).max(5).optional(),
  }).min(1),
);

export const validateListBookings = validate(
  Joi.object({
    ...pagination,
    status: Joi.string().valid(...BOOKING_STATUSES).optional(),
    farmer_id: Joi.string().uuid().optional(),
    driver_id: Joi.string().uuid().optional(),
    search: Joi.string().trim().max(200).optional(),
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().optional(),
  }),
  'query',
);

export const validateUpdateBookingStatus = validate(
  Joi.object({
    status: Joi.string().valid(...BOOKING_STATUSES).required(),
    note: Joi.string().trim().max(500).optional(),
  }),
);

export const validatePeriod = validate(Joi.object({ period }), 'query');
export const validateAnalyticsQuery = validate(
  Joi.object({ period, group_by: Joi.string().valid('day', 'week', 'month').default('day') }),
  'query',
);

export const validateMonitoringQuery = validate(
  Joi.object({ ...pagination, status: Joi.string().valid(...BOOKING_STATUSES).optional() }),
  'query',
);

export function getAdminProfile(req) {
  return {
    id: req.user.id,
    role: req.user.role,
    permissions: getPermissionsForRole(req.user.role),
  };
}
