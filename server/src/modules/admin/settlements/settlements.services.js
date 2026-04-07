// src/modules/admin/settlements/settlements.service.js
import { prisma } from "../../../config/db.config.js";
// ─── Rider settlement summary ─────────────────────────────────────────────────
// Shows each rider's unremitted COD balance

export async function getRiderSettlementSummary({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  // Get all riders who have unremitted COD
  const riders = await prisma.riderProfile.findMany({
    skip,
    take: limit,
    where: {
      shipments: {
        some: {
          transaction: { paymentType: "COD", isRemitted: false },
        },
      },
    },
    include: {
      user: { select: { fullName: true, phoneNumber: true, email: true } },
      shipments: {
        where: {
          transaction: { paymentType: "COD", isRemitted: false },
        },
        include: {
          transaction: { select: { codAmount: true, isRemitted: true } },
        },
      },
    },
  });

  const total = await prisma.riderProfile.count({
    where: {
      shipments: {
        some: {
          transaction: { paymentType: "COD", isRemitted: false },
        },
      },
    },
  });

  // Aggregate unremitted COD per rider
  const summary = riders.map(rider => {
    const unremittedTotal = rider.shipments.reduce((sum, s) => {
      return sum + (s.transaction?.codAmount ?? 0);
    }, 0);

    return {
      riderId:        rider.id,
      riderName:      rider.user.fullName,
      phone:          rider.user.phoneNumber,
      email:          rider.user.email,
      pendingOrders:  rider.shipments.length,
      unremittedTotal,
    };
  });

  return { summary, total, page, limit };
}

// ─── Rider settlement detail ──────────────────────────────────────────────────

export async function getRiderSettlementDetail(riderId) {
  const rider = await prisma.riderProfile.findUnique({
    where:   { id: riderId },
    include: { user: { select: { fullName: true, phoneNumber: true } } },
  });
  if (!rider) throw { status: 404, message: "Rider not found." };

  const [pending, settled] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        paymentType: "COD",
        isRemitted:  false,
        shipment:    { riderId },
      },
      include: {
        shipment: {
          select: {
            trackingNumber:  true,
            receiverName:    true,
            deliveryAddress: true,
            createdAt:       true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),

    prisma.transaction.findMany({
      where: {
        paymentType: "COD",
        isRemitted:  true,
        shipment:    { riderId },
      },
      include: {
        shipment: {
          select: {
            trackingNumber:  true,
            receiverName:    true,
            createdAt:       true,
          },
        },
      },
      orderBy: { remittedAt: "desc" },
      take: 20, // last 20 settled for history
    }),
  ]);

  const pendingTotal  = pending.reduce((s, t) => s + t.codAmount, 0);
  const settledTotal  = settled.reduce((s, t) => s + t.codAmount, 0);

  return {
    rider:        { id: rider.id, name: rider.user.fullName, phone: rider.user.phoneNumber },
    pendingTotal,
    settledTotal,
    pendingTransactions: pending,
    recentSettled:       settled,
  };
}

// ─── Shipment log / history for a specific shipment ──────────────────────────

export async function getShipmentLogs(shipmentId) {
  const shipment = await prisma.shipment.findUnique({
    where:   { id: shipmentId },
    include: {
      merchant: { select: { businessName: true } },
      rider:    { select: { user: { select: { fullName: true } } } },
    },
  });
  if (!shipment) throw { status: 404, message: "Shipment not found." };

  const logs = await prisma.shipmentLog.findMany({
    where:   { shipmentId },
    include: { updatedBy: { select: { fullName: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return { shipment, logs };
}