import * as recommendationService from '../services/recommendationService.js';
import { success } from '../../utils/apiResponse.js';

export const recommend = async (req, res) => {
  const recommendation = await recommendationService.generateRecommendation(req.body);
  return success(res, recommendation, 'Transport recommendation generated');
};
