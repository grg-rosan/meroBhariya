// src/modules/merchant/merchant.routes.js

import { Router } from "express";
import shipmentRoutes     from "./shipment/shipment.route.js";
import documentRoutes     from "./documents/merchant.doc.route.js";
import walletRoutes       from "./wallet/wallet.routes.js";
import subscriptionRoutes from "./subscription/subscription.route.js";
import { requireMerchantProfile, requireVerifiedMerchant } from "./merchant.middleware.js";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("MERCHANT"));

router.use("/shipments",    requireMerchantProfile, requireVerifiedMerchant, shipmentRoutes);
router.use("/documents",    requireMerchantProfile, documentRoutes);
router.use("/payments",     requireMerchantProfile, requireVerifiedMerchant, walletRoutes);
router.use("/subscription", requireMerchantProfile, subscriptionRoutes); // ✅ added

export default router;