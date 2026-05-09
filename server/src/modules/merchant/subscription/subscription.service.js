// src/modules/merchant/subscription/subscription.service.js

import { prisma }   from "../../../config/db.config.js";
import AppError     from "../../../utils/error/appError.js";

// ─── Get all active plans ─────────────────────────────────────────────────────

export async function getPlans() {
  const plans = await prisma.plan.findMany({
    where:   { isActive: true },
    orderBy: { price: "asc" },
    select: {
      id:            true,
      name:          true,
      price:         true,
      shipmentQuota: true,
      overageRate:   true,
    },
  });
  return { plans };
}

// ─── Get current merchant subscription ───────────────────────────────────────

export async function getSubscription(merchantId) {
  const subscription = await prisma.merchantSubscription.findUnique({
    where:   { merchantId },
    include: {
      plan: {
        select: {
          id:            true,
          name:          true,
          price:         true,
          shipmentQuota: true,
          overageRate:   true,
        },
      },
    },
  });

  if (!subscription) return null;

  // Auto-expire if period has passed and status is still ACTIVE
  if (
    subscription.status === "ACTIVE" &&
    new Date() > new Date(subscription.currentPeriodEnd)
  ) {
    const updated = await prisma.merchantSubscription.update({
      where:   { merchantId },
      data:    { status: "EXPIRED" },
      include: { plan: true },
    });
    return updated;
  }

  return subscription;
}

// ─── Subscribe / upgrade to a plan ───────────────────────────────────────────

export async function subscribeToPlan(merchantId, planId) {
  // Validate plan exists and is active
  const plan = await prisma.plan.findFirst({
    where: { id: planId, isActive: true },
  });
  if (!plan) throw new AppError("Plan not found or no longer available.", 404);

  const now   = new Date();
  const end   = new Date(now);
  end.setMonth(end.getMonth() + 1); // 1 month billing cycle

  // Upsert — create if no subscription exists, update if upgrading/renewing
  const subscription = await prisma.merchantSubscription.upsert({
    where:  { merchantId },
    create: {
      merchantId,
      planId,
      status:             "ACTIVE",
      shipmentsUsed:      0,
      currentPeriodStart: now,
      currentPeriodEnd:   end,
    },
    update: {
      planId,
      status:             "ACTIVE",
      shipmentsUsed:      0,        // reset usage on plan change
      currentPeriodStart: now,
      currentPeriodEnd:   end,
    },
    include: {
      plan: {
        select: {
          id:            true,
          name:          true,
          price:         true,
          shipmentQuota: true,
          overageRate:   true,
        },
      },
    },
  });

  return subscription;
}