// src/modules/admin/finance/finance.service.js
import { prisma } from "../../../config/prisma.js";

// ─── Revenue summary ──────────────────────────────────────────────────────────

export async function getRevenueSummary({ from, to } = {}) {
  const dateFilter = buildDateFilter(from, to);

  const [totalFareRevenue, codRevenue, shipmentCount, byVehicleType] = await Promise.all([
    // Total platform fare collected
    prisma.transaction.aggregate({
      where:  { createdAt: dateFilter },
      _sum:   { totalFare: true },
      _count: { _all: true },
    }),

    // Total COD collected
    prisma.transaction.aggregate({
      where: { paymentType: "COD", createdAt: dateFilter },
      _sum:  { codAmount: true },
    }),

    // Total shipments in range
    prisma.shipment.count({
      where: { createdAt: dateFilter },
    }),

    // Revenue broken down by vehicle type
    prisma.transaction.groupBy({
      by:    ["shipmentId"],
      where: { createdAt: dateFilter },
      _sum:  { totalFare: true },
    }),
  ]);

  return {
    totalFareRevenue: totalFareRevenue._sum.totalFare ?? 0,
    totalCodCollected: codRevenue._sum.codAmount ?? 0,
    totalTransactions: totalFareRevenue._count._all,
    totalShipments:    shipmentCount,
  };
}

// ─── COD Settlements ──────────────────────────────────────────────────────────

export async function getPendingCOD({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      skip,
      take:  limit,
      where: { paymentType: "COD", isRemitted: false },
      include: {
        shipment: {
          select: {
            trackingNumber: true,
            receiverName:   true,
            deliveryAddress: true,
            status:          true,
            merchant: { select: { businessName: true } },
            rider:    { select: { user: { select: { fullName: true } } } },
          },
        },
      },
      orderBy: { createdAt: "asc" }, // oldest first — settle FIFO
    }),
    prisma.transaction.count({
      where: { paymentType: "COD", isRemitted: false },
    }),
  ]);

  const totalHeld = await prisma.transaction.aggregate({
    where: { paymentType: "COD", isRemitted: false },
    _sum:  { codAmount: true },
  });

  return {
    transactions,
    total,
    page,
    limit,
    totalHeld: totalHeld._sum.codAmount ?? 0,
  };
}

export async function settleCOD(transactionId, { collectedByRider, adminId }) {
  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!tx) throw { status: 404, message: "Transaction not found." };
  if (tx.isRemitted) throw { status: 409, message: "Already remitted." };
  if (tx.paymentType !== "COD") throw { status: 400, message: "Not a COD transaction." };

  return prisma.transaction.update({
    where: { id: transactionId },
    data: {
      isRemitted:      true,
      remittedAt:      new Date(),
      collectedByRider: collectedByRider ?? tx.codAmount,
    },
  });
}

// Bulk settle all pending COD for a specific rider
export async function settleAllCODForRider(riderId) {
  const shipments = await prisma.shipment.findMany({
    where:  { riderId, status: "DELIVERED" },
    select: { id: true },
  });
  const shipmentIds = shipments.map(s => s.id);

  const result = await prisma.transaction.updateMany({
    where: {
      shipmentId:  { in: shipmentIds },
      paymentType: "COD",
      isRemitted:  false,
    },
    data: {
      isRemitted: true,
      remittedAt: new Date(),
    },
  });

  return { settled: result.count };
}

// ─── Transaction list ─────────────────────────────────────────────────────────

export async function getTransactions({ page = 1, limit = 20, paymentType, isRemitted, from, to } = {}) {
  const skip  = (page - 1) * limit;
  const where = {
    ...(paymentType != null && { paymentType }),
    ...(isRemitted  != null && { isRemitted: isRemitted === "true" }),
    createdAt: buildDateFilter(from, to),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      skip, take: limit, where,
      include: {
        shipment: {
          select: {
            trackingNumber:  true,
            receiverName:    true,
            deliveryAddress: true,
            status:          true,
            merchant: { select: { businessName: true } },
            rider:    { select: { user: { select: { fullName: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, page, limit };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildDateFilter(from, to) {
  if (!from && !to) return undefined;
  return {
    ...(from && { gte: new Date(from) }),
    ...(to   && { lte: new Date(to)   }),
  };
}