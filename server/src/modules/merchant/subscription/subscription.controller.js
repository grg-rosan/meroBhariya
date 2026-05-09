// src/modules/merchant/subscription/subscription.controller.js

import { catchAsync } from "../../../utils/error/errorHandler.js";
import * as subscriptionService from "./subscription.service.js";

// ─── GET /api/merchant/subscription/plans ────────────────────────────────────

export const getPlans = catchAsync(async (req, res) => {
  const result = await subscriptionService.getPlans();
  res.status(200).json(result);
});

// ─── GET /api/merchant/subscription ──────────────────────────────────────────

export const getSubscription = catchAsync(async (req, res) => {
  const result = await subscriptionService.getSubscription(req.merchantProfileId);
  res.status(200).json(result);
});

// ─── POST /api/merchant/subscription ─────────────────────────────────────────

export const subscribeToPlan = catchAsync(async (req, res) => {
  const { planId } = req.body;

  if (!planId) {
    return res.status(400).json({ message: "planId is required." });
  }

  const result = await subscriptionService.subscribeToPlan(
    req.merchantProfileId,
    planId
  );
  res.status(200).json(result);
});