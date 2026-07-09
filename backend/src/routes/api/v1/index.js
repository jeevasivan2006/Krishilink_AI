import { Router } from 'express';
import farmerRoutes from '../../../farmer/routes/farmerRoutes.js';
import bookingRoutes from '../../../booking/routes/bookingRoutes.js';
import sharedMatchingRoutes from '../../../sharedMatching/routes/sharedMatchingRoutes.js';
import returnTripRoutes from '../../../returnTrip/routes/returnTripRoutes.js';
import aiRoutes from '../../../ai/routes/aiRoutes.js';
import trackingRoutes from '../../../tracking/routes/trackingRoutes.js';
import notificationRoutes from '../../../notifications/routes/notificationRoutes.js';
import adminRoutes from '../../../admin/routes/adminRoutes.js';
import driverRoutes from '../../../driver/routes/driverRoutes.js';

const router = Router();

router.use('/farmer', farmerRoutes);
router.use('/bookings', bookingRoutes);
router.use('/shared-groups', sharedMatchingRoutes);
router.use('/return-trips', returnTripRoutes);
router.use('/ai', aiRoutes);
router.use('/tracking', trackingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/driver', driverRoutes);

export default router;

