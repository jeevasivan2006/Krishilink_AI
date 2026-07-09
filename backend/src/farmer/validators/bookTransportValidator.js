import Joi from 'joi';
import { errorResponse } from '../../utils/apiResponse.js';

const schema = Joi.object({
  vehicle_id: Joi.string().uuid().required(),
  start_location: Joi.string().min(1).required(),
  end_location: Joi.string().min(1).required(),
  scheduled_at: Joi.date().iso().required(),
});

export const validateBookTransport = (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(d => d.message).join(', ');
    return errorResponse(res, { message: messages }, 400);
  }
  next();
};
