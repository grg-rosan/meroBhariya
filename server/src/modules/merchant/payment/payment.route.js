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

router.post("/initiate/:shipmentId", initiateExistingPayment);
router.post("/initiate", computeFareMw, initiatePayment);
router.get("/verify", verifyPayment);

export default router;
