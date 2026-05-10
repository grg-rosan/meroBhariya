import { prisma }      from "../../../config/db.config.js";
import AppError        from "../../../utils/error/appError.js";
import { findProfile } from "../rider.services.js";

// ── getRiderCODSummary ────────────────────────────────────────
// Shows rider what COD cash they are currently holding
// and what they have already remitted to admin

export async function getRiderCODSummary(userId) {
  const profile = await findProfile(userId);

  const [holding, remitted] = await Promise.all([
    // Cash rider physically holds — delivered but not yet remitted to admin
    prisma.cODRecord.findMany({
      where: {
        collectedById: profile.id,
        status:        "COLLECTED",   // rider has cash, not handed to admin yet
      },
      select: {
        id:          true,
        amount:      true,
        collectedAt: true,
        shipment: {
          select: {
            id:              true,
            trackingNumber:  true,
            receiverName:    true,
            deliveryAddress: true,
            codAmount:       true,
          },
        },
      },
      orderBy: { collectedAt: "desc" },
    }),

    // Already remitted to admin
    prisma.cODRecord.findMany({
      where: {
        collectedById: profile.id,
        status:        { in: ["REMITTED", "RECONCILED"] },
      },
      select: {
        id:          true,
        amount:      true,
        collectedAt: true,
        remittedAt:  true,
        status:      true,
        shipment: {
          select: {
            id:             true,
            trackingNumber: true,
            receiverName:   true,
            codAmount:      true,
          },
        },
      },
      orderBy: { remittedAt: "desc" },
      take:    20,
    }),
  ]);

  const totalHolding  = holding.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalRemitted = remitted.reduce((sum, r) => sum + Number(r.amount), 0);

  return { totalHolding, totalRemitted, holding, recentlyRemitted: remitted };
}

// ── markCODCollected ──────────────────────────────────────────
// Called when rider marks shipment as DELIVERED
// Moves CODRecord from PENDING → COLLECTED
// This should be called inside your delivery confirmation flow

export async function markCODCollected(shipmentId, riderId) {
  const codRecord = await prisma.cODRecord.findUnique({
    where: { shipmentId },
  });

  if (!codRecord) return; // PREPAID shipment — nothing to do
  if (codRecord.status !== "PENDING") {
    throw new AppError(`COD record is already in status: ${codRecord.status}.`, 400);
  }

  return prisma.cODRecord.update({
    where: { shipmentId },
    data: {
      status:        "COLLECTED",
      collectedById: riderId,
      collectedAt:   new Date(),
    },
  });
}

// ── remitCODToAdmin ───────────────────────────────────────────
// Rider declares they have handed cash to admin physically
// Admin must confirm on their end via reconcileCOD (separate admin service)

export async function remitCODToAdmin(userId, shipmentIds) {
  const profile = await findProfile(userId);

  if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
    throw new AppError("shipmentIds must be a non-empty array.", 400);
  }

  // Verify all COD records belong to this rider and are COLLECTED (not yet remitted)
  const codRecords = await prisma.cODRecord.findMany({
    where: {
      shipmentId:    { in: shipmentIds },
      collectedById: profile.id,
      status:        "COLLECTED",
    },
    select: {
      id:         true,
      shipmentId: true,
      amount:     true,
      shipment:   { select: { trackingNumber: true } },
    },
  });

  if (codRecords.length !== shipmentIds.length) {
    const foundIds   = codRecords.map((r) => r.shipmentId);
    const invalidIds = shipmentIds.filter((id) => !foundIds.includes(id));
    throw new AppError(
      `Some shipments are invalid, not yours, or not in COLLECTED status: ${invalidIds.join(", ")}`,
      400
    );
  }

  const totalAmount = codRecords.reduce((sum, r) => sum + Number(r.amount), 0);
  const now         = new Date();

  await prisma.$transaction(async (tx) => {
    // Move CODRecords to REMITTED — admin confirms separately
    await tx.cODRecord.updateMany({
      where: { shipmentId: { in: shipmentIds }, status: "COLLECTED" },
      data:  { status: "REMITTED", remittedToId: null, remittedAt: now },
      // remittedToId left null until admin confirms receipt
    });

    // Log on each shipment
    await tx.shipmentLog.createMany({
      data: shipmentIds.map((shipmentId) => ({
        shipmentId,
        status:      "DELIVERED",
        note:        "COD cash remitted to admin by rider.",
        updatedById: profile.userId,
      })),
    });
  });

  return {
    remittedCount: codRecords.length,
    totalAmount,
    remittedAt:    now,
    shipments: codRecords.map((r) => ({
      shipmentId:     r.shipmentId,
      trackingNumber: r.shipment.trackingNumber,
      amount:         Number(r.amount),
    })),
  };
}