import { prisma } from "../../../config/db.config.js";
import AppError from "../../../utils/error/appError.js";
// ── Peak hour windows (NPT = UTC+5:45) ───────────────────────
const PEAK_WINDOWS = [
  { start: 7,  end: 9  },
  { start: 12, end: 14 },
  { start: 18, end: 21 },
];
const PEAK_MULTIPLIER = 1.5;
const COD_BONUS       = 20;   // NPR flat

// ── Monthly milestone bonuses ─────────────────────────────────
const MONTHLY_BONUSES = [
  { threshold: 200, bonus: 4000 },
  { threshold: 100, bonus: 1500 },
  { threshold: 50,  bonus: 500  },
];

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function isPeakHour(date = new Date()) {
  const nptOffset = 345 * 60 * 1000; // UTC+5:45
  const nptDate   = new Date(date.getTime() + nptOffset);
  const hour      = nptDate.getUTCHours();
  return PEAK_WINDOWS.some((w) => hour >= w.start && hour < w.end);
}

function calculateRiderEarning({ fareSnapshot, codAmount, riderCutPct, deliveredAt }) {
  const cutPct   = Number(riderCutPct) / 100;
  let   base     = Number(fareSnapshot) * cutPct;
  const peakHour = isPeakHour(deliveredAt ?? new Date());

  if (peakHour) base *= PEAK_MULTIPLIER;

  const codBonus = Number(codAmount ?? 0) > 0 ? COD_BONUS : 0;
  const total    = Math.round((base + codBonus) * 100) / 100;

  return {
    base:     Math.round(base * 100) / 100,
    codBonus,
    peakHour,
    total,
  };
}

// ─────────────────────────────────────────
// MONTHLY MILESTONE CHECK
// Runs inside the same $transaction as earning credit.
// Uses existing RiderWallet + RiderTransaction — no new model.
// Only credits when delivery count hits exact threshold.
// ─────────────────────────────────────────

async function checkMilestoneBonus(riderId, walletId, tx) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const deliveriesThisMonth = await tx.shipment.count({
    where: {
      riderId,
      status:    "DELIVERED",
      updatedAt: { gte: monthStart },
    },
  });

  // Only fires on exact threshold — not every delivery above it
  const hit = MONTHLY_BONUSES.find((b) => deliveriesThisMonth === b.threshold);
  if (!hit) return null;

  await tx.riderWallet.update({
    where: { riderId },
    data:  {
      balance:     { increment: hit.bonus },
      totalEarned: { increment: hit.bonus },
    },
  });

  await tx.riderTransaction.create({
    data: {
      walletId,
      type:   "BONUS",
      amount: hit.bonus,
      note:   `Milestone bonus — ${hit.threshold} deliveries this month`,
    },
  });

  return { threshold: hit.threshold, bonus: hit.bonus };
}

// ─────────────────────────────────────────
// MAIN — called by finance.services.js settleDelivery()
// ─────────────────────────────────────────

export async function settleDeliveryEarning({ shipmentId, codCollected }) {
  const shipment = await prisma.shipment.findUnique({
    where:  { id: shipmentId },
    select: {
      id:             true,
      fareSnapshot:   true,
      codAmount:      true,
      riderId:        true,
      trackingNumber: true,
      vehicleType: {
        select: { fareConfig: { select: { riderCutPct: true } } },
      },
      rider: {
        select: { wallet: { select: { id: true, balance: true } } },
      },
    },
  });

  if (!shipment)          throw new AppError(`Shipment ${shipmentId} not found`, 404);
  if (!shipment.riderId)  throw new AppError(`Shipment ${shipmentId} has no rider`, 400);

  const fareConfig = shipment.vehicleType?.fareConfig;
  if (!fareConfig) throw new AppError(`No fare config for shipment ${shipmentId}`, 400);

  // Auto-create wallet if missing — safety net for older accounts
  let wallet = shipment.rider.wallet;
  if (!wallet) {
    wallet = await prisma.riderWallet.create({
      data: { riderId: shipment.riderId, balance: 0, totalEarned: 0 },
    });
  }

  const earning = calculateRiderEarning({
    fareSnapshot: shipment.fareSnapshot,
    codAmount:    codCollected ?? shipment.codAmount,
    riderCutPct:  fareConfig.riderCutPct,
    deliveredAt:  new Date(),
  });

  const result = await prisma.$transaction(async (tx) => {
    // 1. Credit wallet
    await tx.riderWallet.update({
      where: { riderId: shipment.riderId },
      data:  {
        balance:     { increment: earning.total },
        totalEarned: { increment: earning.total },
      },
    });

    // 2. Record earning transaction
    await tx.riderTransaction.create({
      data: {
        walletId:   wallet.id,
        shipmentId: shipment.id,
        type:       "DELIVERY_EARNING",
        amount:     earning.total,
        note: [
          `Base: NPR ${earning.base}`,
          earning.peakHour          ? `Peak ×${PEAK_MULTIPLIER}`        : null,
          earning.codBonus > 0      ? `COD bonus: NPR ${earning.codBonus}` : null,
        ].filter(Boolean).join(" | "),
      },
    });

    // 3. Check milestone — writes to same RiderWallet + RiderTransaction
    const milestone = await checkMilestoneBonus(shipment.riderId, wallet.id, tx);

    return { earning, milestone };
  });

  return {
    shipmentId:     shipment.id,
    trackingNumber: shipment.trackingNumber,
    earning:        result.earning,
    milestone:      result.milestone ?? null,
  };
}