// src/modules/merchant/subscription/subscription.routes.js
// Mounted at /api/merchant/subscription by merchant.routes.js
// requireAuth + requireMerchantProfile already applied by parent router.

import { Router } from "express";
import { getPlans, getSubscription, subscribeToPlan } from "./subscription.controller.js";

const router = Router();

// GET  /api/merchant/subscription/plans  — all active plans (for PlanGrid)
router.get("/plans", getPlans);

// GET  /api/merchant/subscription        — current merchant subscription + plan
router.get("/", getSubscription);

// POST /api/merchant/subscription        — subscribe or upgrade { planId }
router.post("/", subscribeToPlan);

export default router;