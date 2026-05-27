import { Router } from "express";
import { requireAuth } from "../../auth/auth.middleware.js";
import { requireMerchantProfile, computeFareMw } from "../merchant.middleware.js";
import {
  initiateExistingPayment,
  initiatePayment,
  verifyPayment,
} from "./payment.controller.js";

const router = Router();

router.use(requireAuth, requireMerchantProfile);

router.post("/initiate", computeFareMw, initiatePayment);
router.post("/initiate/:shipmentId", initiateExistingPayment);
router.get("/verify", verifyPayment);

export default router;
