import Joi from 'joi';
import { clientError } from '../../utils/apiResponse.js';

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const message = error.details.map(d => d.message).join(', ');
      return clientError(res, message, 400);
    }
    req.body = value;
    next();
  };
}

const recommendSchema = Joi.object({
  pickup: Joi.string().trim().min(1).max(500).required(),
  destination: Joi.string().trim().min(1).max(500).required(),
  crop_type: Joi.string().trim().min(1).max(100).required(),
  weight_kg: Joi.number().precision(2).min(0.01).max(50000).required(),
  delivery_date: Joi.date().iso().min('now').required(),
});

export const validateRecommend = validate(recommendSchema);
