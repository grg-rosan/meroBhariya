// src/modules/merchant/merchant.routes.js
import { Router }                           from "express";
import { requireAuth, requireRole }         from "../auth/auth.middleware.js";
import { requireMerchantProfile }           from "./merchant.middleware.js";
import { getMyProfile }                     from "./merchant.controller.js";
import shipmentRoutes                       from "./shipment/shipment.route.js";
import documentRoutes                       from "./documents/merchant.doc.route.js";
import paymentRoutes                        from "./payment/payment.route.js";

const router = Router();

// All merchant routes require auth + MERCHANT role
router.use(requireAuth, requireRole("MERCHANT"));

// GET /api/merchant/me — own profile + pickup district
router.get("/me", requireMerchantProfile, getMyProfile);

router.use("/shipments", requireMerchantProfile, shipmentRoutes);
router.use("/documents", requireMerchantProfile, documentRoutes);
router.use("/payment",   requireMerchantProfile, paymentRoutes);

export default router;