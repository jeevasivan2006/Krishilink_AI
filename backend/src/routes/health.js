import { Router } from 'express';
import { healthCheck } from '../config/database.js';
import { success } from '../utils/apiResponse.js';
import asyncWrapper from '../middlewares/asyncWrapper.js';

const router = Router();

router.get(
  '/health',
  asyncWrapper(async (_req, res) => {
    const dbHealthy = await healthCheck();
    return success(res, { database: dbHealthy ? 'connected' : 'disconnected' }, 'Service health');
  }),
);

export default router;
