import { prisma } from "../../config/db.config.js";
import AppError from "../../utils/error/appError.js";
import { buildDateFilter } from "../../utils/others/dateFilter.js";
import { parsePagination } from "../../utils/others/pagination.js";
import {
  publish,
  publishMerchantNotification,
} from "../../infrastructure/rabbitmq/publisher.js";

export const findProfile = async (userId) => {
  const profile = await prisma.riderProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      isOnline: true,
      isVerified: true,
      vehicleNumber: true,
      vehicleType: { select: { name: true } },
      user: { select: { fullName: true } },
    },
  });
  if (!profile) throw new AppError("Rider profile not found", 404);
  return profile;
};


export const toggleDutyStatus = async (userId, isOnline) => {
  const profile = await findProfile(userId);
  if (!profile.isVerified)
    throw new AppError("Your account must be verified before going on duty", 403);

  const updated = await prisma.riderProfile.update({
    where: { id: profile.id },
    data:  { isOnline },  // set explicitly, don't blind-toggle
    select: { id: true, isOnline: true },
  });
  return updated;
};

export const getShiftSummary = async (userId) => {
  const profile = await findProfile(userId);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [deliveredToday, activityLogs] = await Promise.all([
    prisma.shipment.findMany({
      where: {
        riderId: profile.id,
        status: "DELIVERED",
        updatedAt: { gte: todayStart },
      },
      select: {
        codAmount: true,
        fareSnapshot: true,
      },
    }),
    prisma.shipmentLog.findMany({
      where: {
        updatedById: userId,
        createdAt: { gte: todayStart },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        note: true,
        createdAt: true,
        shipment: {
          select: {
            trackingNumber: true,
            receiverName: true,
            deliveryAddress: true,
          },
        },
      },
    }),
  ]);

  const deliveriesToday = deliveredToday.length;
  const codCollected = deliveredToday.reduce((sum, s) => sum + (s.codAmount ?? 0), 0);
  const todayEarnings = deliveredToday.reduce((sum, s) => sum + (s.fareSnapshot ?? 0), 0);

  return {
    rider: {
      fullName: profile.user.fullName,
      vehicleType: profile.vehicleType?.name ?? "—",
      vehicleNumber: profile.vehicleNumber,
      isOnline: profile.isOnline,
      isVerified:    profile.isVerified,
    },
    stats: {
      deliveriesToday,
      codCollected,
      todayEarnings,
      kmCovered: null, 
    },
    activity: activityLogs.map((log) => ({
      id: log.id,
      status: log.status,
      note: log.note,
      trackingNumber: log.shipment.trackingNumber,
      receiverName: log.shipment.receiverName,
      deliveryAddress: log.shipment.deliveryAddress,
      time: log.createdAt,
    })),
  };
};
export const getRiderManifest = async (userId) => {
  const profile = await findProfile(userId);

  const shipments = await prisma.$queryRaw`
    SELECT
      s.id,
      s."trackingNumber",
      s.status,
      s."receiverName",
      s."receiverPhone",
      s."deliveryAddress",
      s."deliveryLat",
      s."deliveryLng",
      s.weight,
      s."isFragile",
      s."codAmount",
      s."fareSnapshot",
      s."createdAt",
      s."updatedAt",
      m."businessName"                    AS "merchantBusinessName",
      m."pickupAddress"                   AS "merchantPickupAddress",
      ST_Y(m.location::geometry)          AS "merchantLat",
      ST_X(m.location::geometry)          AS "merchantLng"
    FROM "Shipment"        s
    JOIN "MerchantProfile" m ON m.id = s."merchantId"
    WHERE s."riderId" = ${profile.id}
      AND s.status IN ('AWAITING_PICKUP', 'PICKED_UP', 'ASSIGNED', 'OUT_FOR_DELIVERY')
    ORDER BY s."updatedAt" ASC
  `;

  if (!shipments.length) return [];

  return shipments.map((s) => ({
    id:              s.id,
    trackingNumber:  s.trackingNumber,
    status:          s.status,
    receiverName:    s.receiverName,
    receiverPhone:   s.receiverPhone,
    deliveryAddress: s.deliveryAddress,
    deliveryLat:     Number(s.deliveryLat),
    deliveryLng:     Number(s.deliveryLng),
    weight:          Number(s.weight),
    isFragile:       s.isFragile,
    codAmount:       Number(s.codAmount),
    fareSnapshot:    s.fareSnapshot,
    createdAt:       s.createdAt,
    updatedAt:       s.updatedAt,
    merchant: {
      businessName:  s.merchantBusinessName,
      pickupAddress: s.merchantPickupAddress,
      pickupLat:     Number(s.merchantLat),
      pickupLng:     Number(s.merchantLng),
    },
  }));
};


export const updateRiderLocation = async (userId, { latitude, longitude }) => {
  const profile = await findProfile(userId);

  await prisma.$executeRaw`
    UPDATE "RiderProfile"
    SET
      "currentLocation" = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
      "isOnline"        = true
    WHERE id = ${profile.id}
  `;

  return { latitude, longitude, updatedAt: new Date() };
};

/**
 * Rider barcode / manual scan — pickup confirms collection at merchant;
 * deliver scan only validates the package is assigned and ready.
 */
export async function scanAssignedShipment(userId, trackingNumber, actionRaw) {
  const profile = await findProfile(userId);
  const action = String(actionRaw ?? "").toUpperCase();

  const rows = await prisma.$queryRaw`
    SELECT
      s.id,
      s."riderId",
      s.status::text AS "status",
      s."trackingNumber",
      s."receiverName",
      s."deliveryAddress",
      s.weight,
      s."codAmount",
      m.user_id AS "merchantUserId"
    FROM "Shipment" s
    INNER JOIN "MerchantProfile" m ON m.id = s."merchantId"
    WHERE s."trackingNumber" = ${trackingNumber}
    LIMIT 1
  `;
  const shipment = rows[0] ?? null;

  if (!shipment) throw new AppError(`Shipment ${trackingNumber} not found`, 404);
  if (shipment.riderId !== profile.id)
    throw new AppError("This shipment is not assigned to you", 403);

  const status = String(shipment.status);

  const summary = {
    id:              shipment.id,
    trackingNumber:  shipment.trackingNumber,
    status,
    receiverName:    shipment.receiverName,
    deliveryAddress: shipment.deliveryAddress,
    weight:          Number(shipment.weight),
    codAmount:       Number(shipment.codAmount),
  };

  // ── PICKUP: merchant → rider ───────────────────────────────────────────────
  if (action === "PICKUP") {
    if (status === "OUT_FOR_DELIVERY" || status === "PICKED_UP") return { ...summary, status };
    if (status !== "AWAITING_PICKUP")
      throw new AppError(`Cannot confirm pickup for status ${status}`, 400);

    const [updated] = await prisma.$transaction([
      prisma.shipment.update({
        where: { id: shipment.id },
        data:  { status: "PICKED_UP" },
        select: { id: true, trackingNumber: true, status: true,
                  receiverName: true, deliveryAddress: true, weight: true, codAmount: true },
      }),
      prisma.shipmentLog.create({
        data: { shipmentId: shipment.id, status: "PICKED_UP",
                note: "Rider confirmed pickup — awaiting hub scan.", updatedById: userId },
      }),
    ]);

    publishMerchantNotification({
      merchantUserId: shipment.merchantUserId,
      shipmentId:     updated.id,
      trackingNumber: updated.trackingNumber,
      status:         "PICKED_UP",
      message:        `Rider collected ${updated.trackingNumber}; heading to hub.`,
    });

    return { ...updated, weight: Number(updated.weight), codAmount: Number(updated.codAmount) };
  }

  // ── HUB_DISPATCH: rider picks up from hub → out for delivery ───────────────
  if (action === "HUB_DISPATCH") {
    if (status !== "ASSIGNED")
      throw new AppError(
        `Package is not ready for hub dispatch (status: ${status}). Dispatcher must assign you first.`,
        400,
      );

    const [updated] = await prisma.$transaction([
      prisma.shipment.update({
        where: { id: shipment.id },
        data:  { status: "OUT_FOR_DELIVERY" },
        select: { id: true, trackingNumber: true, status: true,
                  receiverName: true, deliveryAddress: true, weight: true, codAmount: true },
      }),
      prisma.shipmentLog.create({
        data: { shipmentId: shipment.id, status: "OUT_FOR_DELIVERY",
                note: "Rider scanned package at hub — out for delivery.", updatedById: userId },
      }),
    ]);

    publishMerchantNotification({
      merchantUserId: shipment.merchantUserId,
      shipmentId:     updated.id,
      trackingNumber: updated.trackingNumber,
      status:         "OUT_FOR_DELIVERY",
      message:        `Your shipment ${updated.trackingNumber} is out for delivery.`,
    });

    return { ...updated, weight: Number(updated.weight), codAmount: Number(updated.codAmount) };
  }

  // ── DELIVER: validate package is ready for delivery confirmation ───────────
  if (action === "DELIVER") {
    if (status !== "OUT_FOR_DELIVERY")
      throw new AppError(`Package not ready for delivery scan (status: ${status})`, 400);
    return summary;
  }

  throw new AppError("Invalid action. Use PICKUP, HUB_DISPATCH, or DELIVER.", 400);
} 