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

export const validateLogin = validate(
  Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
  }),
);

export const validateRefreshToken = validate(
  Joi.object({
    refreshToken: Joi.string().required(),
  }),
);

export const validateChangePassword = validate(
  Joi.object({
    currentPassword: Joi.string().min(6).max(128).required(),
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required()
      .messages({
        'string.pattern.base':
          'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&)',
      }),
  }),
);

export const validateRegister = validate(
  Joi.object({
    name:          Joi.string().min(2).max(100).required(),
    email:         Joi.string().email().required(),
    phone:         Joi.string().pattern(/^[0-9]{10}$/).allow('', null).optional(),
    password:      Joi.string().min(8).max(128).required(),
    role:          Joi.string().valid('farmer', 'driver').required(),
    // Farmer optional fields
    farmName:      Joi.string().max(100).allow('', null).optional(),
    farmLocation:  Joi.string().max(200).allow('', null).optional(),
    // Driver optional fields
    vehicleType:   Joi.string().max(50).allow('', null).optional(),
    licenseNumber: Joi.string().max(50).allow('', null).optional(),
  }),
);
