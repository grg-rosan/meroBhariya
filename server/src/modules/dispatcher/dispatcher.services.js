import { prisma } from "../../config/db.config.js";
import { publish } from "../../infrastructure/rabbitmq/publisher.js";
import AppError from "../../utils/error/appError.js";
import { buildPaginationMeta } from "../../utils/others/pagination.js";
import {
  publishRiderNotification,
  publishMerchantNotification,
} from "../../infrastructure/rabbitmq/publisher.js";

// ─── Get pending shipments (dispatcher board) ─────────────────────────────────

export async function getPendingShipments({ page, limit, skip }) {
  const where = { status: "PENDING" };

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      skip,
      take:  limit,
      where,
      include: {
        merchant:    { select: { businessName: true, pickupAddress: true } },
        vehicleType: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" }, // FIFO
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

export async function assignRider(shipmentId, riderId, dispatcherId) {
  const shipment = await prisma.shipment.findUnique({
    where:   { id: shipmentId },
    include: { merchant: { select: { userId: true } } },
  });
  if (!shipment) throw new AppError("Shipment not found.", 404);
  if (shipment.status !== "PENDING")
    throw new AppError("Only PENDING shipments can be assigned.", 400);

  const rider = await prisma.riderProfile.findFirst({
    where:   { id: riderId, isVerified: true, isOnline: true },
    include: { user: { select: { id: true, fullName: true } } },
  });
  if (!rider) throw new AppError("Rider not found or unavailable.", 404);

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.shipment.update({
      where: { id: shipmentId },
      data:  { riderId, status: "ASSIGNED" },
    });
    await tx.shipmentLog.create({
      data: {
        shipmentId,
        status:      "ASSIGNED",
        note:        `Assigned to rider ${rider.user.fullName}`,
        updatedById: dispatcherId,
      },
    });
    return s;
  });

  publishRiderNotification({
    riderUserId:     rider.user.id,
    shipmentId:      updated.id,
    trackingNumber:  updated.trackingNumber,
    deliveryAddress: updated.deliveryAddress,
    receiverName:    updated.receiverName,
    receiverPhone:   updated.receiverPhone,
    fareSnapshot:    updated.fareSnapshot,
  });

  publishMerchantNotification({
    merchantUserId: shipment.merchant.userId,
    shipmentId:     updated.id,
    trackingNumber: updated.trackingNumber,
    status:         "ASSIGNED",
    message:        `Your shipment ${updated.trackingNumber} has been assigned to a rider.`,
  });

  return updated;
}

// ─── Two-man hub handoff ──────────────────────────────────────────────────────

export async function scanHandoff(shipmentId, dispatcherUserId) {
  const shipment = await prisma.shipment.findUnique({
    where:   { id: shipmentId },
    include: { merchant: { select: { userId: true } } },
  });
  if (!shipment) throw new AppError("Shipment not found.", 404);
  if (shipment.status !== "PICKED_UP")
    throw new AppError("Shipment must be PICKED_UP before hub handoff.", 400);

  // First scan
  if (!shipment.isHandoffPending) {
    await prisma.shipment.update({
      where: { id: shipmentId },
      data:  { isHandoffPending: true, handoffInitiatorId: dispatcherUserId },
    });
    return {
      message: "First scan recorded. Waiting for second dispatcher to confirm.",
      step:    1,
    };
  }

  // Second scan — must be a different dispatcher
  if (shipment.handoffInitiatorId === dispatcherUserId)
    throw new AppError("Two-man rule: a different dispatcher must perform the second scan.", 400);

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
    trackingNumber: shipment.trackingNumber,
    status:         "IN_HUB",
    riderId:        shipment.riderId,
    merchantId:     shipment.merchantId,
    event:          "shipment:status_updated",
  });

  publishMerchantNotification({
    merchantUserId: shipment.merchant.userId,
    shipmentId,
    trackingNumber: shipment.trackingNumber,
    status:         "IN_HUB",
    message:        `Your shipment ${shipment.trackingNumber} has arrived at the hub.`,
  });

  return { message: "Handoff confirmed. Shipment is now IN_HUB.", step: 2, shipment: updated };
}

// ─── Update shipment status (dispatcher-driven transitions) ───────────────────

const VALID_TRANSITIONS = {
  IN_HUB:   ["OUT_FOR_DELIVERY"],
  ASSIGNED: ["PICKED_UP"],
};

export async function updateShipmentStatus(shipmentId, newStatus, dispatcherUserId) {
  const shipment = await prisma.shipment.findUnique({
    where:   { id: shipmentId },
    include: { merchant: { select: { userId: true } } },
  });
  if (!shipment) throw new AppError("Shipment not found.", 404);

  const allowed = VALID_TRANSITIONS[shipment.status];
  if (!allowed || !allowed.includes(newStatus))
    throw new AppError(`Cannot transition from ${shipment.status} to ${newStatus}.`, 400);

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.shipment.update({
      where: { id: shipmentId },
      data:  { status: newStatus },
    });
    await tx.shipmentLog.create({
      data: { shipmentId, status: newStatus, updatedById: dispatcherUserId },
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

  publishMerchantNotification({
    merchantUserId: shipment.merchant.userId,
    shipmentId,
    trackingNumber: shipment.trackingNumber,
    status:         newStatus,
    message:        `Your shipment ${shipment.trackingNumber} is now ${newStatus}.`,
  });

  return updated;
}