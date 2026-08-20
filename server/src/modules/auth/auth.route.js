// src/modules/auth/auth.routes.js
import { Router } from "express";
import {
  loginHandler,
  initiateRegistrationHandler,
  completeRegistrationHandler,
  resendRegistrationOtpHandler,
  getMeHandler,
  logoutHandler,
  sendOtpHandler,
  verifyOtpHandler,
  forgotPasswordHandler,
  verifyPasswordResetHandler,
  resetPasswordHandler,
  changePasswordHandler
} from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";
import { otpLimiter,authLimiter } from "../../middlewares/rateLimit.middleware.js";
const router = Router();

// Public
router.post("/login", authLimiter, loginHandler);
router.post("/register/initiate", authLimiter, initiateRegistrationHandler);
router.post("/register/complete", authLimiter, completeRegistrationHandler);
router.post("/register/resend-otp", otpLimiter, resendRegistrationOtpHandler);

// OTP
router.post("/otp/send", otpLimiter, sendOtpHandler);
router.post("/otp/verify", otpLimiter, verifyOtpHandler);

// Password
router.post("/password/forgot", authLimiter, forgotPasswordHandler);
router.post("/password/verify-code", otpLimiter, verifyPasswordResetHandler);
router.post("/password/reset", authLimiter, resetPasswordHandler);

// Protected
router.get("/me", requireAuth, getMeHandler);
router.patch("/password/change", requireAuth, changePasswordHandler);
router.post("/logout", requireAuth, logoutHandler);

export default router;