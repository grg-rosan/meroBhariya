import { prisma } from "../../config/db.config.js";
import AppError from "../../utils/error/appError.js";
import { generateTrackingNumber } from "./helpers/generateTrackingNumber.js";

// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────

export const createShipmentService = async (userId, body) => {
  const {
    vehicleTypeId,
    receiverName,
    receiverPhone,
    deliveryAddress,
    weight,
    isFragile = false,
    orderValue,
    codAmount = 0,
    paymentType,
    distanceKm,   // provided by client (from map widget) or geocalc
  } = body;

  // merchant must have a profile
  const merchantProfile = await prisma.merchantProfile.findUnique({
    where: { userId },
  });
  if (!merchantProfile) throw new AppError("Merchant profile not found", 404);

  // fare config must exist for this vehicle type
  const fareConfig = await prisma.fareConfig.findUnique({
    where: { vehicleTypeId },
  });
  if (!fareConfig) throw new AppError("No fare config found for this vehicle type", 404);
  if (!fareConfig.isActive) throw new AppError("This vehicle type is currently unavailable", 400);

  const fareSnapshot = calculateFare(fareConfig, {
    distanceKm,
    weightKg: weight,
    isFragile,
    paymentType,
    codAmount,
    isNight: isNightTime(),
  });

  const shipment = await prisma.shipment.create({
    data: {
      trackingNumber:  generateTrackingNumber(),
      merchantId:      merchantProfile.id,
      vehicleTypeId,
      receiverName,
      receiverPhone,
      deliveryAddress,
      weight,
      isFragile,
      orderValue,
      codAmount,
      fareSnapshot,
      status:          "PENDING",
    },
  });

  // initial log
  await prisma.shipmentLog.create({
    data: {
      shipmentId:  shipment.id,
      status:      "PENDING",
      note:        "Shipment created by merchant.",
      updatedById: userId,
    },
  });

  return shipment;
};

// ─────────────────────────────────────────
// LIST / FILTER
// ─────────────────────────────────────────

export const listShipmentsService = async (userId, userRole, query) => {
  const { status, page = 1, limit = 20 } = query;

  const where = {};

  // merchants only see their own shipments
  if (userRole === "MERCHANT") {
    const merchantProfile = await prisma.merchantProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!merchantProfile) throw new AppError("Merchant profile not found", 404);
    where.merchantId = merchantProfile.id;
  }

  // riders only see shipments assigned to them
  if (userRole === "RIDER") {
    const riderProfile = await prisma.riderProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!riderProfile) throw new AppError("Rider profile not found", 404);
    where.riderId = riderProfile.id;
  }

  if (status) where.status = status.toUpperCase();

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    Number(limit),
      include: {
        merchant: { select: { businessName: true, pickupAddress: true } },
        rider:    { select: { vehicleNumber: true, user: { select: { fullName: true } } } },
        vehicleType: { select: { name: true } },
      },
    }),
    prisma.shipment.count({ where }),
  ]);

  return {
    shipments,
    pagination: {
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─────────────────────────────────────────
// GET SINGLE + LOGS
// ─────────────────────────────────────────

export const getShipmentService = async (shipmentId, userId, userRole) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: {
      merchant:    { select: { businessName: true, pickupAddress: true, userId: true } },
      rider:       { select: { vehicleNumber: true, licenseNumber: true, user: { select: { fullName: true, phoneNumber: true } } } },
      vehicleType: { select: { name: true } },
      logs: {
        orderBy: { createdAt: "asc" },
        include: { updatedBy: { select: { fullName: true, role: true } } },
      },
      transaction: true,
    },
  });

  if (!shipment) throw new AppError("Shipment not found", 404);

  // merchants can only view their own
  if (userRole === "MERCHANT" && shipment.merchant.userId !== userId) {
    throw new AppError("Not authorized to view this shipment", 403);
  }

  return shipment;
};

// ─────────────────────────────────────────
// ASSIGN RIDER
// ─────────────────────────────────────────

export const assignRiderService = async (shipmentId, riderId, userId) => {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) throw new AppError("Shipment not found", 404);

  if (!["PENDING", "ASSIGNED"].includes(shipment.status)) {
    throw new AppError(`Cannot assign a rider to a shipment with status: ${shipment.status}`, 400);
  }

  // riderId here is the RiderProfile.id, not userId
  const riderProfile = await prisma.riderProfile.findUnique({ where: { id: riderId } });
  if (!riderProfile)   throw new AppError("Rider profile not found", 404);
  if (!riderProfile.isVerified) throw new AppError("Rider is not verified", 400);

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.shipment.update({
      where: { id: shipmentId },
      data:  { riderId, status: "ASSIGNED" },
    });
    await tx.shipmentLog.create({
      data: {
        shipmentId,
        status:      "ASSIGNED",
        note:        `Rider manually assigned.`,
        updatedById: userId,
      },
    });
    return s;
  });

  return updated;
};

// ─────────────────────────────────────────
// UPDATE STATUS
// ─────────────────────────────────────────

// Valid forward-only transitions
const TRANSITIONS = {
  PENDING:          ["ASSIGNED", "CANCELLED"],
  ASSIGNED:         ["PICKED_UP", "CANCELLED"],
  PICKED_UP:        ["IN_HUB"],
  IN_HUB:           ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURNED"],
  DELIVERED:        [],
  CANCELLED:        [],
  RETURNED:         [],
};

export const updateStatusService = async (shipmentId, newStatus, userId, note) => {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) throw new AppError("Shipment not found", 404);

  const allowed = TRANSITIONS[shipment.status];
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      `Invalid transition: ${shipment.status} → ${newStatus}. Allowed: ${allowed.join(", ") || "none"}`,
      400
    );
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
        note:        note || `Status updated to ${newStatus}.`,
        updatedById: userId,
      },
    });
    return s;
  });

  return updated;
};

// ─────────────────────────────────────────
// CANCEL
// ─────────────────────────────────────────

const CANCELLABLE_STATUSES = ["PENDING", "ASSIGNED"];

export const cancelShipmentService = async (shipmentId, userId, userRole) => {
  const shipment = await prisma.shipment.findUnique({
    where:   { id: shipmentId },
    include: { merchant: { select: { userId: true } } },
  });
  if (!shipment) throw new AppError("Shipment not found", 404);

  // merchant can only cancel their own
  if (userRole === "MERCHANT" && shipment.merchant.userId !== userId) {
    throw new AppError("Not authorized to cancel this shipment", 403);
  }

  if (!CANCELLABLE_STATUSES.includes(shipment.status)) {
    throw new AppError(`Cannot cancel a shipment with status: ${shipment.status}`, 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.shipment.update({
      where: { id: shipmentId },
      data:  { status: "CANCELLED" },
    });
    await tx.shipmentLog.create({
      data: {
        shipmentId,
        status:      "CANCELLED",
        note:        `Cancelled by ${userRole}.`,
        updatedById: userId,
      },
    });
    return s;
  });

  return updated;
};

// ─────────────────────────────────────────
// TWO-MAN HANDOFF
// ─────────────────────────────────────────

export const handleHandoff = async (shipmentId, userId, userRole) => {
  return await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) throw new AppError("Shipment not found", 404);

    // STEP 1: Dispatcher initiates
    if (!shipment.isHandoffPending) {
      if (userRole !== "DISPATCHER") {
        throw new AppError("Only a Dispatcher can initiate a hub exit", 403);
      }
      await tx.shipment.update({
        where: { id: shipmentId },
        data:  { isHandoffPending: true, handoffInitiatorId: userId },
      });
      await tx.shipmentLog.create({
        data: {
          shipmentId,
          status:      "IN_HUB",
          note:        "Handoff initiated by Dispatcher. Awaiting Rider verification.",
          updatedById: userId,
        },
      });
      return { status: "pending_rider_scan", message: "Dispatcher scan recorded." };
    }

    // STEP 2: Rider confirms
    if (userRole !== "RIDER") {
      throw new AppError("A Rider must perform the second scan to confirm receipt", 403);
    }
    if (shipment.handoffInitiatorId === userId) {
      throw new AppError("Safety violation: Initiator and Receiver cannot be the same person", 400);
    }

    const riderProfile = await tx.riderProfile.findUnique({
      where:  { userId },
      select: { id: true },
    });
    if (!riderProfile) throw new AppError("Rider profile not found", 404);

    const updated = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        status:             "OUT_FOR_DELIVERY",
        isHandoffPending:   false,
        handoffInitiatorId: null,
        riderId:            riderProfile.id,  // RiderProfile.id, not userId
      },
    });
    await tx.shipmentLog.create({
      data: {
        shipmentId,
        status:      "OUT_FOR_DELIVERY",
        note:        "Two-man handoff complete. Package with Rider.",
        updatedById: userId,
      },
    });
    return { status: "success", data: updated };
  });
};