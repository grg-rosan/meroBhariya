import { prisma }  from "../../config/db.config.js";
import { publish } from "../../infrastructure/rabbitmq/publisher.js";
import AppError    from "../../utils/error/appError.js";
import { buildPaginationMeta } from "../../utils/others/pagination.js";
import {
  publishRiderNotification,
  publishMerchantNotification,
} from "../../infrastructure/rabbitmq/publisher.js";

// ─── Pending shipments ────────────────────────────────────────────────────────

export async function getPendingShipments({ page, limit, skip }) {
  const where = { status: "PENDING" };
  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      skip, take: limit, where,
      include: {
        merchant:    { select: { businessName: true, pickupAddress: true } },
        vehicleType: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.shipment.count({ where }),
  ]);
  return { shipments, ...buildPaginationMeta(total, page, limit) };
}

// ─── Hub inventory ────────────────────────────────────────────────────────────

export async function getHubInventory({ page, limit, skip }) {
  const where = { status: { in: ["IN_HUB", "ASSIGNED", "OUT_FOR_DELIVERY"] } };
  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      skip, take: limit, where,
      include: {
        merchant:    { select: { businessName: true } },
        vehicleType: { select: { name: true } },
        rider:       { select: { user: { select: { fullName: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.shipment.count({ where }),
  ]);

  const stats = {
    inHub:          await prisma.shipment.count({ where: { status: "IN_HUB" } }),
    unassigned:     await prisma.shipment.count({ where: { status: "IN_HUB", riderId: null } }),
    assigned:       await prisma.shipment.count({ where: { status: "ASSIGNED" } }),
    outForDelivery: await prisma.shipment.count({ where: { status: "OUT_FOR_DELIVERY" } }),
  };

  return { shipments, stats, ...buildPaginationMeta(total, page, limit) };
}

// ─── Stuck packages ───────────────────────────────────────────────────────────

export async function getStuckPackages() {
  const now          = new Date();
  const twoHoursAgo  = new Date(now - 2 * 60 * 60 * 1000);
  const fourHoursAgo = new Date(now - 4 * 60 * 60 * 1000);

  const stuck = await prisma.shipment.findMany({
    where: {
      OR: [
        { status: "PENDING",  createdAt: { lt: twoHoursAgo } },
        { status: "ASSIGNED", updatedAt: { lt: fourHoursAgo } },
      ],
    },
    include: {
      merchant:    { select: { businessName: true } },
      vehicleType: { select: { name: true } },
      rider:       { select: { user: { select: { fullName: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return stuck.map((s) => ({
    ...s,
    stuckReason:
      s.status === "PENDING"
        ? "No rider assigned for over 2 hours"
        : "Rider assigned but not picked up for over 4 hours",
    stuckDurationMinutes: Math.round((now - new Date(s.updatedAt)) / 60000),
  }));
}

// ─── Available riders ─────────────────────────────────────────────────────────

export async function getAvailableRiders(vehicleTypeId = null) {
  return prisma.riderProfile.findMany({
    where: {
      ...(vehicleTypeId ? { vehicleTypeId: Number(vehicleTypeId) } : {}),
      isOnline:   true,
      isVerified: true,
      shipments: {
        none: { status: { in: ["ASSIGNED", "PICKED_UP", "IN_HUB", "OUT_FOR_DELIVERY"] } },
      },
    },
    include: {
      user:        { select: { fullName: true, phoneNumber: true } },
      vehicleType: { select: { id: true, name: true } },
    },
  });
}

// ─── Nearest riders (PostGIS) ─────────────────────────────────────────────────

export async function getNearestRiders({ lat, lng, vehicleTypeId = null, limit = 10 }) {
  const riders = await prisma.$queryRaw`
    SELECT
      rp.id,
      rp."vehicleNumber",
      rp."vehicleTypeId",
      u."fullName"                                        AS name,
      u."phoneNumber"                                     AS phone,
      vt.name                                             AS vehicle,
      ST_Distance(
        rp."currentLocation"::geography,
        ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography
      )                                                   AS distance_meters,
      ST_X(rp."currentLocation"::geometry)               AS lng,
      ST_Y(rp."currentLocation"::geometry)               AS lat
    FROM "RiderProfile" rp
    JOIN "User"        u  ON u.id  = rp."userId"
    JOIN "VehicleType" vt ON vt.id = rp."vehicleTypeId"
    WHERE rp."isOnline"        = true
      AND rp."isVerified"      = true
      AND rp."currentLocation" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "Shipment" s
        WHERE s."riderId" = rp.id
          AND s.status IN ('ASSIGNED','PICKED_UP','IN_HUB','OUT_FOR_DELIVERY')
      )
      ${vehicleTypeId ? prisma.$raw`AND rp."vehicleTypeId" = ${parseInt(vehicleTypeId)}` : prisma.$raw``}
    ORDER BY distance_meters ASC
    LIMIT ${limit}
  `;
  return riders;
}

// ─── Assign rider ─────────────────────────────────────────────────────────────

export async function assignRider(shipmentId, riderId, dispatcherId) {
  const shipment = await prisma.shipment.findUnique({
    where:   { id: shipmentId },
    include: { merchant: { select: { userId: true } } },
  });
  if (!shipment)                throw new AppError("Shipment not found.", 404);
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


export async function scanToHub(trackingNumber, dispatcherUserId) {
  const shipment = await prisma.shipment.findUnique({
    where:   { trackingNumber },
    include: { merchant: { select: { userId: true } } },
  });

  if (!shipment)
    throw new AppError(`No shipment found for tracking number ${trackingNumber}.`, 404);

  if (!["PICKED_UP", "PENDING"].includes(shipment.status))
    throw new AppError(
      `Cannot scan shipment with status ${shipment.status} into hub.`,
      400
    );

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.shipment.update({
      where: { id: shipment.id },
      data:  { status: "IN_HUB" },
    });
    await tx.shipmentLog.create({
      data: {
        shipmentId:  shipment.id,
        status:      "IN_HUB",
        note:        "Scanned into hub by dispatcher.",
        updatedById: dispatcherUserId,
      },
    });
    return s;
  });

  publish("shipment.status.updated", {
    shipmentId:     shipment.id,
    trackingNumber: shipment.trackingNumber,
    status:         "IN_HUB",
    riderId:        shipment.riderId,
    merchantId:     shipment.merchantId,
    event:          "shipment:status_updated",
  });

  publishMerchantNotification({
    merchantUserId: shipment.merchant.userId,
    shipmentId:     shipment.id,
    trackingNumber: shipment.trackingNumber,
    status:         "IN_HUB",
    message:        `Your shipment ${shipment.trackingNumber} has arrived at the hub.`,
  });

  return {
    trackingNumber:  updated.trackingNumber,
    status:          updated.status,
    receiverName:    updated.receiverName,
    deliveryAddress: updated.deliveryAddress,
  };
}

// ─── Status transitions ───────────────────────────────────────────────────────

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
  if (!allowed?.includes(newStatus))
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