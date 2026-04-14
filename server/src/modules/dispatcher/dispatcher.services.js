// src/modules/dispatcher/dispatcher.service.js
import { prisma }       from "../../config/prisma.js";
import { publish } from "../../infrastructure/rabbitmq/publisher.js";
import { appError }     from "../../utils/errorHandler.js";
import { buildPaginationMeta } from "../../utils/pagination.js";

// ─── Get pending shipments (dispatcher board) ─────────────────────────────────

export async function getPendingShipments({ page, limit, skip }) {
  const where = { status: "PENDING" };

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      skip,
      take: limit,
      where,
      include: {
        merchant:    { select: { businessName: true, pickupAddress: true } },
        vehicleType: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" }, // oldest first — FIFO
    }),
    prisma.shipment.count({ where }),
  ]);

  return { shipments, ...buildPaginationMeta(total, page, limit) };
}

// ─── Get available riders for a vehicle type ──────────────────────────────────

export async function getAvailableRiders(vehicleTypeId) {
  return prisma.riderProfile.findMany({
    where: {
      vehicleTypeId: Number(vehicleTypeId),
      isOnline:      true,
      isVerified:    true,
      // Not already on an active shipment
      shipments: {
        none: {
          status: { in: ["ASSIGNED", "PICKED_UP", "IN_HUB", "OUT_FOR_DELIVERY"] },
        },
      },
    },
    include: {
      user: { select: { fullName: true, phoneNumber: true } },
    },
  });
}

// ─── Assign rider to shipment ─────────────────────────────────────────────────

export async function assignRider(shipmentId, riderId, dispatcherUserId) {
  // 1. Load shipment
  const shipment = await prisma.shipment.findUnique({
    where:   { id: shipmentId },
    include: { merchant: { select: { userId: true, businessName: true } } },
  });
  if (!shipment)                     throw appError(404, "Shipment not found.");
  if (shipment.status !== "PENDING") throw appError(400, `Shipment is already ${shipment.status}.`);

  // 2. Load rider + verify eligibility
  const rider = await prisma.riderProfile.findUnique({
    where:   { id: riderId },
    include: { user: { select: { fullName: true, phoneNumber: true } } },
  });
  if (!rider)            throw appError(404, "Rider not found.");
  if (!rider.isVerified) throw appError(400, "Rider is not verified.");
  if (!rider.isOnline)   throw appError(400, "Rider is not online.");

  // 3. Use updateMany with null-guard to prevent race condition
  //    If two dispatchers try to assign simultaneously, only one wins
  const result = await prisma.shipment.updateMany({
    where: { id: shipmentId, status: "PENDING", riderId: null },
    data:  { status: "ASSIGNED", riderId },
  });

  if (result.count === 0) {
    throw appError(409, "Shipment was already assigned by another dispatcher.");
  }

  // 4. Log the assignment
  await prisma.shipmentLog.create({
    data: {
      shipmentId,
      status:      "ASSIGNED",
      note:        `Assigned to ${rider.user.fullName} by dispatcher`,
      updatedById: dispatcherUserId,
    },
  });

  // 5. Publish assignment event → notification consumer delivers to rider + merchant
  publish("shipment.assigned", {
    shipmentId,
    trackingNumber:  shipment.trackingNumber,
    riderId:         rider.id,
    riderUserId:     rider.userId,
    riderName:       rider.user.fullName,
    merchantId:      shipment.merchantId,
    merchantUserId:  shipment.merchant.userId,
    merchantName:    shipment.merchant.businessName,
    deliveryAddress: shipment.deliveryAddress,
    fareSnapshot:    shipment.fareSnapshot,
    event:           "shipment:assigned", // Socket.IO event name for the consumer
  });

  return prisma.shipment.findUnique({
    where:   { id: shipmentId },
    include: {
      rider:    { include: { user: { select: { fullName: true, phoneNumber: true } } } },
      merchant: { select: { businessName: true } },
    },
  });
}

// ─── Two-man hub handoff ──────────────────────────────────────────────────────
// First dispatcher scans  → isHandoffPending = true
// Second dispatcher scans → status moves to IN_HUB

export async function scanHandoff(shipmentId, dispatcherUserId) {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) throw appError(404, "Shipment not found.");

  if (shipment.status !== "PICKED_UP") {
    throw appError(400, "Shipment must be PICKED_UP before hub handoff.");
  }

  // First scan
  if (!shipment.isHandoffPending) {
    await prisma.shipment.update({
      where: { id: shipmentId },
      data:  { isHandoffPending: true, handoffInitiatorId: dispatcherUserId },
    });

    return { message: "First scan recorded. Waiting for second dispatcher to confirm.", step: 1 };
  }

  // Second scan — must be a different dispatcher
  if (shipment.handoffInitiatorId === dispatcherUserId) {
    throw appError(400, "Two-man rule: a different dispatcher must perform the second scan.");
  }

  // Confirm handoff → move to IN_HUB
  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.shipment.update({
      where: { id: shipmentId },
      data:  { status: "IN_HUB", isHandoffPending: false, handoffInitiatorId: null },
    });

    await tx.shipmentLog.create({
      data: {
        shipmentId,
        status:      "IN_HUB",
        note:        "Two-man handoff confirmed at hub",
        updatedById: dispatcherUserId,
      },
    });

    return s;
  });

  publish("shipment.status.updated", {
    shipmentId,
    trackingNumber:  shipment.trackingNumber,
    status:          "IN_HUB",
    riderId:         shipment.riderId,
    merchantId:      shipment.merchantId,
    event:           "shipment:status_updated",
  });

  return { message: "Handoff confirmed. Shipment is now IN_HUB.", step: 2, shipment: updated };
}

// ─── Update shipment status (dispatcher-driven transitions) ───────────────────

const VALID_TRANSITIONS = {
  IN_HUB:   ["OUT_FOR_DELIVERY"],
  ASSIGNED: ["PICKED_UP"],
};

export async function updateShipmentStatus(shipmentId, newStatus, dispatcherUserId) {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) throw appError(404, "Shipment not found.");

  const allowed = VALID_TRANSITIONS[shipment.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw appError(400, `Cannot transition from ${shipment.status} to ${newStatus}.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.shipment.update({
      where: { id: shipmentId },
      data:  { status: newStatus },
    });

    await tx.shipmentLog.create({
      data: {
        shipmentId,
        status:      newStatus,
        updatedById: dispatcherUserId,
      },
    });

    return s;
  });

  publish("shipment.status.updated", {
    shipmentId,
    trackingNumber: shipment.trackingNumber,
    status:         newStatus,
    riderId:        shipment.riderId,
    merchantId:     shipment.merchantId,
    event:          "shipment:status_updated",
  });

  return updated;
}
// Shipments stuck in hub beyond expected time (e.g. > 48 hrs with IN_HUB status)
export async function getStuckShipments({ page, limit, skip }) {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where: {
        status: 'IN_HUB',
        updatedAt: { lt: cutoff },
      },
      skip,
      take: limit,
      orderBy: { updatedAt: 'asc' },
      include: { merchant: true, rider: true },
    }),
    prisma.shipment.count({
      where: { status: 'IN_HUB', updatedAt: { lt: cutoff } },
    }),
  ]);

  return { shipments, total, page, limit };
}


