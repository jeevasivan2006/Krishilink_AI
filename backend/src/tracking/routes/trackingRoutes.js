import { Router } from 'express';
import asyncWrapper from '../../middlewares/asyncWrapper.js';
import authenticate from '../../middlewares/authenticate.js';
import * as trackingController from '../controllers/trackingController.js';
import {
  validateBookingId,
  validateDriverId,
  validateHistoryQuery,
  validateStoreRoute,
  validateUpdateLocation,
} from '../validators/trackingValidators.js';

const router = Router();

router.use(authenticate);

router.post('/location', validateUpdateLocation, asyncWrapper(trackingController.updateLocation));
router.get('/drivers/:driverId/location', validateDriverId, asyncWrapper(trackingController.getDriverLocation));

router.post('/bookings/:bookingId/start', validateBookingId, asyncWrapper(trackingController.startTracking));
router.get('/bookings/:bookingId', validateBookingId, asyncWrapper(trackingController.getBookingTracking));
router.get('/bookings/:bookingId/eta', validateBookingId, asyncWrapper(trackingController.getEta));
router.get('/bookings/:bookingId/history', validateBookingId, validateHistoryQuery, asyncWrapper(trackingController.getHistory));
router.post('/bookings/:bookingId/route', validateBookingId, validateStoreRoute, asyncWrapper(trackingController.storeRoute));
router.get('/bookings/:bookingId/route', validateBookingId, asyncWrapper(trackingController.getRoute));
router.post('/bookings/:bookingId/complete', validateBookingId, asyncWrapper(trackingController.completeTracking));

export default router;
