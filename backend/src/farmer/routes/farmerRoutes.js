import { Router } from 'express';
import asyncWrapper from '../../middlewares/asyncWrapper.js';
import authenticate from '../../middlewares/authenticate.js';
import * as farmerController from '../../farmer/controllers/farmerController.js';

const router = Router();

// All farmer routes require authentication
router.use(authenticate);

// Dashboard & profile
router.get('/dashboard', asyncWrapper(farmerController.getDashboard));
router.get('/profile', asyncWrapper(farmerController.getProfile));
// router.put('/profile', asyncWrapper(farmerController.updateProfile));

// Booking operations
router.post('/bookings', asyncWrapper(farmerController.bookTransport));
router.get('/bookings', asyncWrapper(farmerController.getBookingHistory));
router.get('/bookings/:bookingId', asyncWrapper(farmerController.getBookingDetails));
router.delete('/bookings/:bookingId', asyncWrapper(farmerController.cancelBooking));
router.get('/estimate-cost', asyncWrapper(farmerController.getEstimatedCost));

export default router;
