import { prisma } from "../../../config/db.config.js";
import { buildPaginationMeta } from "../../../utils/others/pagination.js";
import AppError from "../../../utils/error/appError.js";
import { publishMerchantNotification } from "../../../infrastructure/rabbitmq/publisher.js";

// ─── Settle delivery (called by RabbitMQ delivery consumer) ──────────────────

export async function settleDelivery({
  shipmentId,
  merchantId,
  riderId,
  codAmount,
  fareSnapshot,
  paymentType,
}) {
  // Idempotency guard — consumer may retry on failure
  const existing = await prisma.transaction.findUnique({ where: { shipmentId } });
  if (existing) {
    console.warn("[Settlement] Already settled, skipping:", shipmentId);
    return existing;
  }

  const shipment = await prisma.shipment.findUnique({
    where:   { id: shipmentId },
    include: { merchant: { select: { userId: true } } },
  });
  if (!shipment) throw new Error(`[Settlement] Shipment not found: ${shipmentId}`);

  const transaction = await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.create({
      data: {
        shipmentId,
        codAmount:   codAmount ?? 0,
        paymentType: paymentType ?? "PREPAID",
        isRemitted:  false,
      },
    });
    await tx.shipmentLog.create({
      data: {
        shipmentId,
        status:      "SETTLED",
        note:        paymentType === "COD"
          ? `COD of Rs.${codAmount} collected. Pending remittance.`
          : "Payment settled.",
        updatedById: riderId,
      },
    });
    return t;
  });

  publishMerchantNotification({
    merchantUserId: shipment.merchant.userId,
    shipmentId,
    status:         "SETTLED",
    message:        paymentType === "COD"
      ? `Shipment delivered. Rs.${codAmount} COD will be remitted after rider handover.`
      : `Shipment delivered successfully.`,
  });

  console.log(
    "[Settlement] Settled shipmentId:", shipmentId,
    "| COD:", codAmount,
    "| type:", paymentType,
  );

  return transaction;
}

// ─── Revenue summary ──────────────────────────────────────────────────────────

export async function getRevenueSummary({ from, to } = {}) {
  const dateFilter = buildDateFilter(from, to);

  const [fareRevenue, codRevenue, shipmentCount] = await Promise.all([
    prisma.transaction.aggregate({
      where:  { createdAt: dateFilter },
      _sum:   { codAmount: true },
      _count: { _all: true },
    }),
    prisma.transaction.aggregate({
      where: { paymentType: "COD", createdAt: dateFilter },
      _sum:  { codAmount: true },
    }),
    prisma.shipment.count({
      where: { createdAt: dateFilter },
    }),
  ]);

  return {
    totalCodCollected: codRevenue._sum.codAmount   ?? 0,
    totalTransactions: fareRevenue._count._all,
    totalShipments:    shipmentCount,
  };
}

// ─── Pending COD list ─────────────────────────────────────────────────────────

export async function getPendingCOD({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [transactions, total, totalHeld] = await Promise.all([
    prisma.transaction.findMany({
      skip,
      take:  limit,
      where: { paymentType: "COD", isRemitted: false },
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
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.count({
      where: { paymentType: "COD", isRemitted: false },
    }),
    prisma.transaction.aggregate({
      where: { paymentType: "COD", isRemitted: false },
      _sum:  { codAmount: true },
    }),
  ]);

  return {
    transactions,
    totalHeld: totalHeld._sum.codAmount ?? 0,
    ...buildPaginationMeta(total, page, limit),
  };
}

// ─── Settle single COD transaction ───────────────────────────────────────────

export async function settleCOD(transactionId, adminId) {
  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!transaction)                      throw new AppError("Transaction not found.", 404);
  if (transaction.isRemitted)            throw new AppError("Already remitted.", 409);
  if (transaction.paymentType !== "COD") throw new AppError("Not a COD transaction.", 400);

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.update({
      where: { id: transactionId },
      data:  { isRemitted: true, remittedAt: new Date() },
    });
    await tx.shipmentLog.create({
      data: {
        shipmentId:  transaction.shipmentId,
        status:      "REMITTED",
        note:        "COD remitted by admin.",
        updatedById: adminId,
      },
    });
    return t;
  });

  return updated;
}

// ─── Bulk settle all COD for a rider ─────────────────────────────────────────

export async function settleAllCODForRider(riderId, adminId) {
  const rider = await prisma.riderProfile.findUnique({ where: { id: riderId } });
  if (!rider) throw new AppError("Rider not found.", 404);

  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      paymentType: "COD",
      isRemitted:  false,
      shipment:    { riderId },
    },
    select: { id: true, shipmentId: true, codAmount: true },
  });

  if (!pendingTransactions.length)
    throw new AppError("No pending COD transactions found for this rider.", 400);

  const shipmentIds   = pendingTransactions.map((t) => t.shipmentId);
  const totalRemitted = pendingTransactions.reduce((sum, t) => sum + t.codAmount, 0);
  const remittedAt    = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.transaction.updateMany({
      where: { shipmentId: { in: shipmentIds }, isRemitted: false },
      data:  { isRemitted: true, remittedAt },
    });
    await tx.shipmentLog.createMany({
      data: shipmentIds.map((shipmentId) => ({
        shipmentId,
        status:      "REMITTED",
        note:        "COD remitted to merchant by admin.",
        updatedById: adminId,
      })),
    });
  });

  console.log(
    "[Finance] Bulk remitted", pendingTransactions.length,
    "transactions for riderId:", riderId,
    "| total:", totalRemitted,
  );

  return { riderId, remittedCount: pendingTransactions.length, totalRemitted, remittedAt };
}

// ─── Transaction list ─────────────────────────────────────────────────────────

export async function getTransactions({ page = 1, limit = 20, paymentType, isRemitted, from, to } = {}) {
  const skip  = (page - 1) * limit;
  const where = {
    ...(paymentType != null && { paymentType }),
    ...(isRemitted  != null && { isRemitted: isRemitted === "true" || isRemitted === true }),
    ...(from || to  ?  { createdAt: buildDateFilter(from, to) } : {}),
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

  return { transactions, ...buildPaginationMeta(total, page, limit) };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildDateFilter(from, to) {
  if (!from && !to) return undefined;
  return {
    ...(from && { gte: new Date(from) }),
    ...(to   && { lte: new Date(to)   }),
  };
}