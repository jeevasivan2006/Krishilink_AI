import { Router } from 'express';
import asyncWrapper from '../../middlewares/asyncWrapper.js';
import authenticate from '../../middlewares/authenticate.js';
import * as returnTripController from '../controllers/returnTripController.js';
import {
  validateCompletionId,
  validateHistory,
  validateListSuggestions,
  validateRecordCompletion,
  validateReject,
  validateReturnTripId,
  validateSuggestionId,
} from '../validators/returnTripValidators.js';

const router = Router();

router.use(authenticate);

router.post('/completions', validateRecordCompletion, asyncWrapper(returnTripController.recordCompletion));
router.get('/availability', asyncWrapper(returnTripController.getAvailability));

router.get('/suggestions', validateListSuggestions, asyncWrapper(returnTripController.listSuggestions));
router.post('/suggestions/:suggestionId/accept', validateSuggestionId, asyncWrapper(returnTripController.acceptSuggestion));
router.post('/suggestions/:suggestionId/reject', validateSuggestionId, validateReject, asyncWrapper(returnTripController.rejectSuggestion));

router.get('/completions/:completionId/nearby', validateCompletionId, asyncWrapper(returnTripController.findNearby));
router.post('/completions/:completionId/suggest', validateCompletionId, asyncWrapper(returnTripController.generateSuggestions));

router.get('/history', validateHistory, asyncWrapper(returnTripController.getHistory));
router.post('/trips/:returnTripId/complete', validateReturnTripId, asyncWrapper(returnTripController.completeTrip));

export default router;
