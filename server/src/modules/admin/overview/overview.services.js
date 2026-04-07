// src/modules/admin/overview/overview.service.js
import { prisma } from "../../../config/db.config.js";
// ─── Stat Cards ───────────────────────────────────────────────────────────────

export async function getPlatformStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    activeMerchants,
    activeRiders,
    shipmentsToday,
    codHeld,
  ] = await Promise.all([
    // Active merchants = users with role MERCHANT and isActive true
    prisma.user.count({
      where: { role: "MERCHANT", isActive: true },
    }),

    // Active riders = riders who are online and verified
    prisma.riderProfile.count({
      where: { isOnline: true, isVerified: true },
    }),

    // Shipments created today (any status)
    prisma.shipment.count({
      where: { createdAt: { gte: today } },
    }),

    // COD held = sum of codAmount on COD shipments not yet remitted
    prisma.transaction.aggregate({
      where: {
        paymentType: "COD",
        isRemitted:  false,
      },
      _sum: { codAmount: true },
    }),
  ]);

  return {
    activeMerchants,
    activeRiders,
    shipmentsToday,
    codHeld: codHeld._sum.codAmount ?? 0,
  };
}

// ─── Platform Health ──────────────────────────────────────────────────────────

export async function getPlatformHealth() {
  const [
    totalShipments,
    deliveredShipments,
    totalRiders,
    onlineRiders,
    pendingMerchantDocs,
    pendingRiderDocs,
    expiredRiderDocs,
  ] = await Promise.all([
    prisma.shipment.count(),

    prisma.shipment.count({ where: { status: "DELIVERED" } }),

    prisma.riderProfile.count({ where: { isVerified: true } }),

    prisma.riderProfile.count({ where: { isOnline: true, isVerified: true } }),

    // Pending merchant verifications = distinct merchants with at least one PENDING doc
    prisma.merchantDocument.groupBy({
      by:     ["merchantId"],
      where:  { status: "PENDING" },
    }).then(r => r.length),

    // Pending rider verifications = distinct riders with at least one PENDING doc
    prisma.riderDocument.groupBy({
      by:     ["riderId"],
      where:  { status: "PENDING" },
    }).then(r => r.length),

    // Expired rider docs = docs past expiresAt that are still APPROVED
    prisma.riderDocument.count({
      where: {
        status:    "APPROVED",
        expiresAt: { lt: new Date() },
      },
    }),
  ]);

  const deliverySuccessRate = totalShipments > 0
    ? ((deliveredShipments / totalShipments) * 100).toFixed(1)
    : 0;

  const riderAvailabilityRate = totalRiders > 0
    ? ((onlineRiders / totalRiders) * 100).toFixed(1)
    : 0;

  return {
    deliverySuccessRate:  Number(deliverySuccessRate),
    riderAvailabilityRate: Number(riderAvailabilityRate),
    pendingVerifications: {
      merchants: pendingMerchantDocs,
      riders:    pendingRiderDocs,
    },
    expiredDocuments: expiredRiderDocs,
  };
}

// ─── Quick Action Counts ──────────────────────────────────────────────────────

export async function getQuickActionCounts() {
  const [pendingMerchants, pendingRiders, pendingCOD] = await Promise.all([
    prisma.merchantDocument.groupBy({
      by:    ["merchantId"],
      where: { status: "PENDING" },
    }).then(r => r.length),

    prisma.riderDocument.groupBy({
      by:    ["riderId"],
      where: { status: "PENDING" },
    }).then(r => r.length),

    prisma.transaction.count({
      where: { paymentType: "COD", isRemitted: false },
    }),
  ]);

  return { pendingMerchants, pendingRiders, pendingCOD };
}

// ─── Recent Activity ──────────────────────────────────────────────────────────
// Pulls recent shipment logs as a unified activity feed

export async function getRecentActivity(limit = 10) {
  const logs = await prisma.shipmentLog.findMany({
    take:    limit,
    orderBy: { createdAt: "desc" },
    include: {
      shipment:  { select: { trackingNumber: true, merchant: { select: { businessName: true } } } },
      updatedBy: { select: { fullName: true, role: true } },
    },
  });

  return logs.map(log => ({
    id:        log.id,
    type:      log.status,
    message:   formatActivityMessage(log),
    createdAt: log.createdAt,
  }));
}

function formatActivityMessage(log) {
  const actor   = log.updatedBy.fullName;
  const tracking = log.shipment.trackingNumber;
  const merchant = log.shipment.merchant?.businessName ?? "Unknown";

  const map = {
    PENDING:          `New shipment ${tracking} created by ${merchant}`,
    ASSIGNED:         `Shipment ${tracking} assigned by ${actor}`,
    PICKED_UP:        `Shipment ${tracking} picked up`,
    IN_HUB:           `Shipment ${tracking} arrived at hub`,
    OUT_FOR_DELIVERY: `Shipment ${tracking} out for delivery`,
    DELIVERED:        `Shipment ${tracking} delivered`,
    CANCELLED:        `Shipment ${tracking} cancelled by ${actor}`,
    RETURNED:         `Shipment ${tracking} returned`,
  };

  return map[log.status] ?? `Shipment ${tracking} updated`;
}