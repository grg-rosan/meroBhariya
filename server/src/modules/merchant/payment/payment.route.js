import { Router } from "express";
import { requireAuth } from "../../auth/auth.middleware.js";
import { requireMerchantProfile, computeFareMw, requireVerifiedMerchant } from "../merchant.middleware.js";
import {
  initiateExistingPayment,
  initiatePayment,
  verifyPayment,
} from "./payment.controller.js";

const router = Router();

router.use(requireAuth, requireMerchantProfile);

router.post("/initiate",requireVerifiedMerchant, computeFareMw, initiatePayment);
router.post("/initiate/:shipmentId", requireVerifiedMerchant,initiateExistingPayment);
router.get("/verify", verifyPayment);

export default router;
