import { Router } from 'express';
import asyncWrapper from '../../middlewares/asyncWrapper.js';
import * as recommendationController from '../controllers/recommendationController.js';
import { validateRecommend } from '../validators/recommendationValidator.js';

const router = Router();

router.post('/recommend', validateRecommend, asyncWrapper(recommendationController.recommend));

export default router;
