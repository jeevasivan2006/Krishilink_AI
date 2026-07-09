import { Router } from 'express';
import asyncWrapper from '../../middlewares/asyncWrapper.js';
import authenticate from '../../middlewares/authenticate.js';
import * as bookingController from '../controllers/bookingController.js';
import {
  validateBookingId,
  validateCancelBooking,
  validateCreateBooking,
  validateListBookings,
  validateUpdateBooking,
  validateUpdateStatus,
} from '../validators/bookingValidators.js';

const router = Router();

router.use(authenticate);

router.post('/', validateCreateBooking, asyncWrapper(bookingController.createBooking));
router.get('/', validateListBookings, asyncWrapper(bookingController.listBookings));
router.get('/:id/timeline', validateBookingId, asyncWrapper(bookingController.getBookingTimeline));
router.get('/:id', validateBookingId, asyncWrapper(bookingController.getBooking));
router.patch('/:id/status', validateBookingId, validateUpdateStatus, asyncWrapper(bookingController.updateBookingStatus));
router.patch('/:id', validateBookingId, validateUpdateBooking, asyncWrapper(bookingController.updateBooking));
router.delete('/:id', validateBookingId, validateCancelBooking, asyncWrapper(bookingController.cancelBooking));

export default router;
