import { prisma }                        from "../../../config/db.config.js";
import { buildPaginationMeta }           from "../../../utils/others/pagination.js";
import AppError                          from "../../../utils/error/appError.js";
import { publishMerchantNotification }   from "../../../infrastructure/rabbitmq/publisher.js";
import { settleDeliveryEarning } from "../../rider/finance/rider.earnings.service.js";
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
        status:      "DELIVERED",
        note:        paymentType === "COD"
          ? `COD of NPR ${codAmount} collected. Pending remittance.`
          : "Payment settled.",
        updatedById: riderId,
      },
    });
    return t;
  });

  // ── NEW: Credit rider earning after transaction record created ──
  try {
    const earningResult = await settleDeliveryEarning({
      shipmentId,
      codCollected: codAmount ?? 0,
    });
    console.log(
      "[Settlement] Rider earning credited: NPR", earningResult.earning.total,
      earningResult.monthlyBonus
        ? `+ NPR ${earningResult.monthlyBonus.bonus} monthly bonus`
        : ""
    );
  } catch (err) {
    // Non-fatal — shipment is already settled, log and continue
    // Prevents earning failure from rolling back the delivery settlement
    console.error("[Settlement] Rider earning failed for", shipmentId, ":", err.message);
  }

  publishMerchantNotification({
    merchantUserId: shipment.merchant.userId,
    shipmentId,
    status:         "DELIVERED",
    message:        paymentType === "COD"
      ? `Shipment delivered. NPR ${codAmount} COD will be remitted after rider handover.`
      : "Shipment delivered successfully.",
  });

  console.log(
    "[Settlement] Settled shipmentId:", shipmentId,
    "| COD:", codAmount,
    "| type:", paymentType,
  );

  return transaction;
}

// ─── Rider Payout — get all pending ──────────────────────────────────────────

export async function getPendingPayouts({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const [payouts, total, totalAmount] = await Promise.all([
    prisma.riderPayout.findMany({
      skip,
      take:    limit,
      where:   { status: { in: ["PENDING", "PROCESSING"] } },
      include: {
        rider: {
          select: {
            id:     true,
            wallet: { select: { balance: true } },
            user:   { select: { fullName: true, phoneNumber: true, email: true } },
          },
        },
      },
      orderBy: { requestedAt: "asc" }, // oldest first — FIFO
    }),
    prisma.riderPayout.count({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
    }),
    prisma.riderPayout.aggregate({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
      _sum:  { amount: true },
    }),
  ]);

  return {
    payouts,
    totalPending:    total,
    totalAmount:     Number(totalAmount._sum.amount ?? 0),
    ...buildPaginationMeta(total, page, limit),
  };
}

// ─── Rider Payout — approve (complete) ───────────────────────────────────────

export async function approvePayout(payoutId, adminId) {
  const payout = await prisma.riderPayout.findUnique({
    where:   { id: payoutId },
    include: {
      rider: {
        select: {
          id:     true,
          wallet: { select: { id: true, balance: true } },
          user:   { select: { fullName: true } },
        },
      },
    },
  });

  if (!payout)                          throw new AppError("Payout request not found.", 404);
  if (payout.status === "COMPLETED")    throw new AppError("Payout already completed.", 409);
  if (payout.status === "FAILED")       throw new AppError("Payout already marked as failed.", 409);

  const wallet = payout.rider.wallet;
  if (!wallet) throw new AppError("Rider wallet not found.", 404);

  // Re-check balance at approval time — may have changed since request
  if (Number(wallet.balance) < Number(payout.amount)) {
    throw new AppError(
      `Insufficient rider wallet balance. Available: NPR ${wallet.balance}, Requested: NPR ${payout.amount}`,
      400
    );
  }

  // Atomic: mark payout complete + deduct wallet + record transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Mark payout as completed
    const updatedPayout = await tx.riderPayout.update({
      where: { id: payoutId },
      data:  {
        status:      "COMPLETED",
        processedAt: new Date(),
      },
    });

    // 2. Deduct wallet balance
    await tx.riderWallet.update({
      where: { id: wallet.id },
      data:  { balance: { decrement: payout.amount } },
    });

    // 3. Record wallet transaction
    await tx.riderTransaction.create({
      data: {
        walletId: wallet.id,
        type:     "DEDUCTION",
        amount:   payout.amount,
        note:     `Payout approved by admin — via ${payout.method}`,
      },
    });

    return updatedPayout;
  });

  console.log(
    "[Finance] Payout approved — riderId:", payout.rider.id,
    "| amount: NPR", payout.amount,
    "| method:", payout.method,
    "| adminId:", adminId,
  );

  return {
    payout:         result,
    riderName:      payout.rider.user.fullName,
    amountPaid:     Number(payout.amount),
    method:         payout.method,
    newBalance:     Number(wallet.balance) - Number(payout.amount),
  };
}

// ─── Rider Payout — reject (fail) ────────────────────────────────────────────

export async function rejectPayout(payoutId, adminId, reason) {
  const payout = await prisma.riderPayout.findUnique({ where: { id: payoutId } });

  if (!payout)                       throw new AppError("Payout request not found.", 404);
  if (payout.status === "COMPLETED") throw new AppError("Cannot reject a completed payout.", 409);
  if (payout.status === "FAILED")    throw new AppError("Payout already rejected.", 409);

  const updated = await prisma.riderPayout.update({
    where: { id: payoutId },
    data:  {
      status:      "FAILED",
      processedAt: new Date(),
    },
  });

  // No wallet deduction — balance stays intact on rejection
  console.log(
    "[Finance] Payout rejected — payoutId:", payoutId,
    "| reason:", reason ?? "No reason given",
    "| adminId:", adminId,
  );

  return {
    payout:  updated,
    message: `Payout NPR ${payout.amount} rejected. Rider balance unchanged.`,
  };
}

// ─── Rider Wallet — manual adjustment ────────────────────────────────────────

export async function adjustRiderWallet(riderId, { amount, type, note }, adminId) {
  if (!["ADJUSTMENT"].includes(type)) {
    throw new AppError("Only ADJUSTMENT type allowed for manual wallet changes.", 400);
  }
  if (!note) throw new AppError("Note is required for manual wallet adjustment.", 400);
  if (!amount || amount === 0) throw new AppError("Amount cannot be zero.", 400);

  const wallet = await prisma.riderWallet.findUnique({
    where:  { riderId },
    select: { id: true, balance: true },
  });
  if (!wallet) throw new AppError("Rider wallet not found.", 404);

  // Prevent negative balance on deduction adjustments
  if (amount < 0 && Number(wallet.balance) + amount < 0) {
    throw new AppError(
      `Adjustment would result in negative balance. Current: NPR ${wallet.balance}`,
      400
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.riderWallet.update({
      where: { id: wallet.id },
      data:  { balance: { increment: amount } },
    });
    await tx.riderTransaction.create({
      data: {
        walletId: wallet.id,
        type:     "ADJUSTMENT",
        amount,
        note:     `Admin adjustment — ${note} (adminId: ${adminId})`,
      },
    });
  });

  return {
    riderId,
    adjustment:  amount,
    newBalance:  Number(wallet.balance) + amount,
    note,
  };
}

// ─── Merchant Wallet — manual adjustment ─────────────────────────────────────

export async function adjustMerchantWallet(merchantId, { amount, type, note }, adminId) {
  if (!["TOPUP", "ADJUSTMENT"].includes(type)) {
    throw new AppError("Type must be TOPUP or ADJUSTMENT.", 400);
  }
  if (!note)   throw new AppError("Note is required for manual wallet adjustment.", 400);
  if (!amount || amount === 0) throw new AppError("Amount cannot be zero.", 400);

  const wallet = await prisma.merchantWallet.findUnique({
    where:  { merchantId },
    select: { id: true, balance: true },
  });
  if (!wallet) throw new AppError("Merchant wallet not found.", 404);

  if (amount < 0 && Number(wallet.balance) + amount < 0) {
    throw new AppError(
      `Adjustment would result in negative balance. Current: NPR ${wallet.balance}`,
      400
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.merchantWallet.update({
      where: { id: wallet.id },
      data:  { balance: { increment: amount } },
    });
    await tx.merchantTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount,
        note:     `Admin adjustment — ${note} (adminId: ${adminId})`,
      },
    });
  });

  return {
    merchantId,
    adjustment: amount,
    newBalance: Number(wallet.balance) + amount,
    note,
  };
}

// ─── Revenue summary ──────────────────────────────────────────────────────────

export async function getRevenueSummary({ from, to } = {}) {
  const dateFilter = buildDateFilter(from, to);

  const [fareRevenue, codRevenue, shipmentCount, riderEarnings] = await Promise.all([
    prisma.transaction.aggregate({
      where:  { ...(dateFilter && { createdAt: dateFilter }) },
      _sum:   { codAmount: true },
      _count: { _all: true },
    }),
    prisma.transaction.aggregate({
      where: { paymentType: "COD", ...(dateFilter && { createdAt: dateFilter }) },
      _sum:  { codAmount: true },
    }),
    prisma.shipment.count({
      where: { ...(dateFilter && { createdAt: dateFilter }) },
    }),
    // Total paid out to riders in period
    prisma.riderTransaction.aggregate({
      where: {
        type:      "DELIVERY_EARNING",
        ...(dateFilter && { createdAt: dateFilter }),
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalCodCollected:  Number(codRevenue._sum.codAmount   ?? 0),
    totalTransactions:  fareRevenue._count._all,
    totalShipments:     shipmentCount,
    totalRiderEarnings: Number(riderEarnings._sum.amount   ?? 0),
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
    totalHeld: Number(totalHeld._sum.codAmount ?? 0),
    ...buildPaginationMeta(total, page, limit),
  };
}

// ─── Settle single COD transaction ───────────────────────────────────────────

export async function settleCOD(transactionId, { collectedByRider, adminId }) {
  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!transaction)                      throw new AppError("Transaction not found.", 404);
  if (transaction.isRemitted)            throw new AppError("Already remitted.", 409);
  if (transaction.paymentType !== "COD") throw new AppError("Not a COD transaction.", 400);

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.update({
      where: { id: transactionId },
      data:  {
        isRemitted:       true,
        remittedAt:       new Date(),
        collectedByRider: collectedByRider ?? 0,
      },
    });
    await tx.shipmentLog.create({
      data: {
        shipmentId:  transaction.shipmentId,
        status:      "DELIVERED",
        note:        `COD of NPR ${transaction.codAmount} remitted by admin.`,
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
        status:      "DELIVERED",
        note:        `COD remitted to merchant by admin (bulk).`,
        updatedById: adminId,
      })),
    });
  });

  console.log(
    "[Finance] Bulk remitted", pendingTransactions.length,
    "transactions for riderId:", riderId,
    "| total: NPR", totalRemitted,
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