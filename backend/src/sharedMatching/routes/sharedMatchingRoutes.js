import { Router } from 'express';
import asyncWrapper from '../../middlewares/asyncWrapper.js';
import authenticate from '../../middlewares/authenticate.js';
import * as sharedMatchingController from '../controllers/sharedMatchingController.js';
import {
  validateBookingIdParam,
  validateGroupAndBookingParams,
  validateGroupId,
  validateJoinGroup,
  validateListGroups,
} from '../validators/sharedMatchingValidators.js';

const router = Router();

router.use(authenticate);

router.get('/', validateListGroups, asyncWrapper(sharedMatchingController.listGroups));

router.get('/matches/:bookingId', validateBookingIdParam, asyncWrapper(sharedMatchingController.findMatches));
router.post('/auto-match/:bookingId', validateBookingIdParam, validateJoinGroup, asyncWrapper(sharedMatchingController.autoMatch));

router.get('/:groupId/capacity', validateGroupId, asyncWrapper(sharedMatchingController.getCapacity));
router.get('/:groupId/cost-split', validateGroupId, asyncWrapper(sharedMatchingController.getCostSplit));
router.get('/:groupId', validateGroupId, asyncWrapper(sharedMatchingController.getGroup));

router.post('/:groupId/join/:bookingId', validateGroupAndBookingParams, asyncWrapper(sharedMatchingController.joinGroup));
router.delete('/:groupId/members/:bookingId', validateGroupAndBookingParams, asyncWrapper(sharedMatchingController.leaveGroup));

export default router;
