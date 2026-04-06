import prisma from "../../../config/db.config.js";
import { AppError } from "../../../utils/AppError.js";
import { parseDateRange } from "../../../utils/dateFilter.js";
import { parsePagination } from "../../../utils/pagination.js";

// ─────────────────────────────────────────
// INTERNAL HELPER
// ─────────────────────────────────────────

const findProfile = async (userId) => {
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

// ─────────────────────────────────────────
// DUTY TOGGLE
// ─────────────────────────────────────────

export const toggleDutyStatus = async (userId) => {
  const profile = await findProfile(userId);

  if (!profile.isVerified) {
    throw new AppError("Your account must be verified before going on duty", 403);
  }

  const updated = await prisma.riderProfile.update({
    where: { id: profile.id },
    data: { isOnline: !profile.isOnline },
    select: { id: true, isOnline: true },
  });

  return updated;
};

// ─────────────────────────────────────────
// DASHBOARD — My Shift
// ─────────────────────────────────────────

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
    },
    stats: {
      deliveriesToday,
      codCollected,
      todayEarnings,
      kmCovered: null, // derived from GPS tracks — future extension
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

// ─────────────────────────────────────────
// MANIFEST
// ─────────────────────────────────────────

export const getRiderManifest = async (userId) => {
  const profile = await findProfile(userId);

  return prisma.shipment.findMany({
    where: {
      riderId: profile.id,
      status: { in: ["PICKED_UP", "OUT_FOR_DELIVERY"] },
    },
    orderBy: { updatedAt: "asc" },
    select: {
      id: true,
      trackingNumber: true,
      receiverName: true,
      receiverPhone: true,
      deliveryAddress: true,
      weight: true,
      isFragile: true,
      codAmount: true,
      fareSnapshot: true,
      status: true,
      createdAt: true,
      merchant: { select: { businessName: true } },
    },
  });
};

// ─────────────────────────────────────────
// DELIVER A PACKAGE
// ─────────────────────────────────────────

export const deliverPackage = async (userId, trackingNumber, { codCollected, note } = {}) => {
  const profile = await findProfile(userId);

  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber },
    select: { id: true, riderId: true, status: true },
  });

  if (!shipment) throw new AppError(`Shipment ${trackingNumber} not found`, 404);
  if (shipment.riderId !== profile.id) throw new AppError("This shipment is not assigned to you", 403);
  if (!["OUT_FOR_DELIVERY", "PICKED_UP"].includes(shipment.status)) {
    throw new AppError(`Cannot deliver a shipment with status: ${shipment.status}`, 400);
  }

  const [updated] = await prisma.$transaction([
    prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: "DELIVERED" },
      select: { id: true, trackingNumber: true, status: true },
    }),
    prisma.shipmentLog.create({
      data: {
        shipmentId: shipment.id,
        status: "DELIVERED",
        note: note ?? null,
        updatedById: userId,
      },
    }),
    prisma.transaction.update({
      where: { shipmentId: shipment.id },
      data: { collectedByRider: codCollected ?? 0 },
    }),
  ]);

  return updated;
};

// ─────────────────────────────────────────
// LOCATION UPDATE  (PostGIS)
// ─────────────────────────────────────────

export const updateRiderLocation = async (userId, { latitude, longitude }) => {
  const profile = await findProfile(userId);

  await prisma.$executeRaw`
    UPDATE "RiderProfile"
    SET "currentLocation" = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
    WHERE id = ${profile.id}
  `;

  return { latitude, longitude, updatedAt: new Date() };
};

// ─────────────────────────────────────────
// EARNINGS HISTORY
// ─────────────────────────────────────────

export const getRiderEarnings = async (userId, query) => {
  const profile = await findProfile(userId);
  const { page, limit, skip } = parsePagination(query);
  const dateFilter = parseDateRange(query);

  const where = {
    riderId: profile.id,
    status: "DELIVERED",
    ...(dateFilter ? { updatedAt: dateFilter } : {}),
  };

  const [total, data] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      select: {
        trackingNumber: true,
        receiverName: true,
        deliveryAddress: true,
        fareSnapshot: true,
        codAmount: true,
        updatedAt: true,
        transaction: {
          select: {
            collectedByRider: true,
            isRemitted: true,
            remittedAt: true,
          },
        },
      },
    }),
  ]);

  return { total, page, limit, data };
};

// ─────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────

export const getRiderDocuments = async (userId) => {
  const profile = await findProfile(userId);

  return prisma.riderDocument.findMany({
    where: { riderId: profile.id },
    orderBy: { uploadedAt: "desc" },
  });
};

export const upsertRiderDocument = async (userId, { type, fileUrl, filePublicId, expiresAt }) => {
  const profile = await findProfile(userId);

  const existing = await prisma.riderDocument.findFirst({
    where: { riderId: profile.id, type },
    select: { id: true },
  });

  const payload = {
    fileUrl,
    filePublicId: filePublicId ?? null,
    status: "PENDING",
    note: null,
    uploadedAt: new Date(),
    reviewedAt: null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  };

  if (existing) {
    return prisma.riderDocument.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return prisma.riderDocument.create({
    data: { riderId: profile.id, type, ...payload },
  });
};