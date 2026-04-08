// src/modules/auth/auth.routes.js
import { Router } from "express";
import {
  loginHandler,
  registerRiderHandler,
  registerMerchantHandler,
  getMeHandler,
  logoutHandler,
} from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";

const router = Router();

// Public
router.post("/login", loginHandler);
router.post("/register/rider", registerRiderHandler);
router.post("/register/merchant", registerMerchantHandler);

// Protected
router.get("/me", requireAuth, getMeHandler);
router.post("/logout", requireAuth, logoutHandler);

export default router;
