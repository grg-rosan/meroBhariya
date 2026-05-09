import { prisma }      from "../../../config/db.config.js";
import AppError        from "../../../utils/error/appError.js";
import { findProfile } from "../rider.services.js";


export const getRiderCODSummary = async (userId) => {
  const profile = await findProfile(userId);

  const [holding, remitted] = await Promise.all([
    // Cash rider still physically holds — delivered but not remitted
    prisma.shipment.findMany({
      where: {
        riderId:   profile.id,
        status:    "DELIVERED",
        codAmount: { gt: 0 },
        transaction: {
          paymentType: "COD",
          isRemitted:  false,
        },
      },
      select: {
        id:             true,
        trackingNumber: true,
        receiverName:   true,
        deliveryAddress: true,
        codAmount:      true,
        updatedAt:      true,
        transaction: {
          select: {
            collectedByRider: true,
            isRemitted:       true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),

    // Already handed to dispatcher
    prisma.shipment.findMany({
      where: {
        riderId:   profile.id,
        status:    "DELIVERED",
        codAmount: { gt: 0 },
        transaction: {
          paymentType: "COD",
          isRemitted:  true,
        },
      },
      select: {
        id:             true,
        trackingNumber: true,
        receiverName:   true,
        deliveryAddress: true,
        codAmount:      true,
        updatedAt:      true,
        transaction: {
          select: {
            collectedByRider: true,
            isRemitted:       true,
            remittedAt:       true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take:    20, // last 20 remitted
    }),
  ]);

  const totalHolding  = holding.reduce((sum, s) => sum + s.codAmount, 0);
  const totalRemitted = remitted.reduce((sum, s) => sum + s.codAmount, 0);

  return {
    totalHolding,
    totalRemitted,
    holding,
    recentlyRemitted: remitted,
  };
};


export const remitCODToDispatcher = async (userId, shipmentIds) => {
  const profile = await findProfile(userId);

  if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
    throw new AppError("shipmentIds must be a non-empty array.", 400);
  }

  // Verify all shipments belong to this rider + are unremitted COD
  const shipments = await prisma.shipment.findMany({
    where: {
      id:      { in: shipmentIds },
      riderId: profile.id,
      status:  "DELIVERED",
      transaction: {
        paymentType: "COD",
        isRemitted:  false,
      },
    },
    select: {
      id:             true,
      trackingNumber: true,
      codAmount:      true,
      transaction:    { select: { id: true } },
    },
  });

  // Check all requested IDs were found and are valid
  if (shipments.length !== shipmentIds.length) {
    const foundIds   = shipments.map((s) => s.id);
    const invalidIds = shipmentIds.filter((id) => !foundIds.includes(id));
    throw new AppError(
      `Some shipments are invalid, not yours, or already remitted: ${invalidIds.join(", ")}`,
      400
    );
  }

  const totalAmount = shipments.reduce((sum, s) => sum + s.codAmount, 0);
  const now         = new Date();

  // Mark as remitted — dispatcher confirms on their end separately
  await prisma.$transaction(async (tx) => {
    await tx.transaction.updateMany({
      where: { shipmentId: { in: shipmentIds }, isRemitted: false },
      data:  { isRemitted: true, remittedAt: now },
    });

    await tx.shipmentLog.createMany({
      data: shipmentIds.map((shipmentId) => ({
        shipmentId,
        status:      "DELIVERED",
        note:        "COD cash handed to dispatcher by rider.",
        updatedById: profile.userId,
      })),
    });
  });

  return {
    remittedCount: shipments.length,
    totalAmount,
    remittedAt:    now,
    shipments:     shipments.map((s) => ({
      id:             s.id,
      trackingNumber: s.trackingNumber,
      codAmount:      s.codAmount,
    })),
  };
};