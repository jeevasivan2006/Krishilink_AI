import { Router } from 'express';
import asyncWrapper from '../../middlewares/asyncWrapper.js';
import authenticate from '../../middlewares/authenticate.js';
import * as notificationController from '../controllers/notificationController.js';
import {
  validateBookingNotification,
  validateTripNotification,
  validateReturnTripAlert,
  validateSharedTruckAlert,
  validatePreview,
  validateListQuery,
  validateNotificationId,
} from '../validators/notificationValidators.js';

const router = Router();

router.get('/events', asyncWrapper(notificationController.getEvents));
router.post('/preview', validatePreview, asyncWrapper(notificationController.preview));

router.post('/booking', validateBookingNotification, asyncWrapper(notificationController.sendBooking));
router.post('/trip', validateTripNotification, asyncWrapper(notificationController.sendTrip));
router.post('/return-trip', validateReturnTripAlert, asyncWrapper(notificationController.sendReturnTrip));
router.post('/shared-truck', validateSharedTruckAlert, asyncWrapper(notificationController.sendSharedTruck));

router.use(authenticate);

router.get('/', validateListQuery, asyncWrapper(notificationController.list));
router.patch('/read-all', asyncWrapper(notificationController.markAllRead));
router.get('/:id', validateNotificationId, asyncWrapper(notificationController.getById));
router.patch('/:id/read', validateNotificationId, asyncWrapper(notificationController.markRead));
router.delete('/:id', validateNotificationId, asyncWrapper(notificationController.deleteNotification));
export default router;
