import { Router } from 'express';
import asyncWrapper from '../../middlewares/asyncWrapper.js';
import authenticate from '../../middlewares/authenticate.js';
import * as driverDashboardController from '../controllers/driverDashboardController.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', asyncWrapper(driverDashboardController.getDashboard));
router.put('/availability', asyncWrapper(driverDashboardController.updateAvailability));
router.post('/bookings/:bookingId/accept', asyncWrapper(driverDashboardController.acceptBooking));
router.post('/bookings/:bookingId/reject', asyncWrapper(driverDashboardController.rejectBooking));

export default router;
