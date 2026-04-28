import { Router } from 'express';
import shipmentRoutes from './shipment/shipment.route.js';
import documentRoutes from "./documents/merchant.doc.route.js"
import { requireMerchantProfile, requireVerifiedMerchant } from "./merchant.middleware.js";
import { requireAuth, requireRole } from '../auth/auth.middleware.js';

const router = Router();
router.use(requireAuth,requireRole("MERCHANT"))

router.use('/shipments',requireMerchantProfile,requireVerifiedMerchant, shipmentRoutes);
router.use("/documents",requireMerchantProfile, documentRoutes);


export default router;
