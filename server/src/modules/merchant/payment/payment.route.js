import { Router }                  from "express";
import { requireAuth }             from "../../auth/auth.middleware.js";
import { requireMerchantProfile,computeFareMw } from "../merchant.middleware.js";
import { initiatePayment, verifyPayment } from "./payment.controller.js";

const router = Router();

router.use(requireAuth, requireMerchantProfile);

// POST — needs computeFare to validate + calculate fare before storing in Redis
router.post("/initiate", computeFareMw, initiatePayment);

// GET — Khalti redirects here after payment
router.get("/verify", verifyPayment);

export default router;