import { Router } from 'express';
import shipmentRoutes from './shipment/shipment.route.js';

const router = Router();

router.use('/shipments', shipmentRoutes);

export default router;
