// src/modules/merchant/shipment/shipment.service.js
import { prisma }       from "../../../config/db.config.js";
import { publish} from "../../../infrastructure/rabbitmq/publisher.js";
import { EXCHANGE } from "../../../infrastructure/rabbitmq/queue.js";
import { appError }     from "../../../utils/errorHandler.js";
import { buildPaginationMeta } from "../../../utils/pagination.js";

// ─── Create shipment ──────────────────────────────────────────────────────────

export async function createShipment(merchantId, data,userId) {
  const {
    receiverName,
    receiverPhone,
    deliveryAddress,
    vehicleTypeId,
    weight,
    isFragile,
    orderValue,
    codAmount,
    paymentType,
  } = data;

  // 1. Validate required fields
  if (!receiverName || !receiverPhone || !deliveryAddress || !vehicleTypeId || !weight || !orderValue || !paymentType) {
    throw appError(400, "Missing required shipment fields.");
  }

  // 2. Load vehicle type + fare config
  const vehicleType = await prisma.vehicleType.findFirst({
    where:   { id: Number(vehicleTypeId), isActive: true },
    include: { fareConfig: true },
  });
  if (!vehicleType)            throw appError(404, "Vehicle type not found or inactive.");
  if (!vehicleType.fareConfig) throw appError(400, `No fare config set for vehicle type: ${vehicleType.name}`);

  // 3. Weight check
  if (weight > vehicleType.maxWeightKg) {
    throw appError(400, `Package weight ${weight}kg exceeds max ${vehicleType.maxWeightKg}kg for ${vehicleType.name}.`);
  }

  // 4. Calculate fare
  const fareSnapshot = calculateFare(vehicleType.fareConfig, {
    weight,
    isFragile:   isFragile ?? false,
    codAmount:   codAmount ?? 0,
    paymentType,
  });

  // 5. Generate tracking number
  const trackingNumber = generateTrackingNumber();

  // 6. Create shipment + first log atomically
  const shipment = await prisma.$transaction(async (tx) => {
    const newShipment = await tx.shipment.create({
      data: {
        trackingNumber,
        merchantId,
        vehicleTypeId: Number(vehicleTypeId),
        receiverName,
        receiverPhone,
        deliveryAddress,
        weight:        Number(weight),
        isFragile:     isFragile ?? false,
        orderValue:    Number(orderValue),
        codAmount:     Number(codAmount ?? 0),
        fareSnapshot,
        status:        "PENDING",
      },
    });

    await tx.shipmentLog.create({
      data: {
        shipmentId:  newShipment.id,
        status:      "PENDING",
        note:        "Shipment created by merchant",
        updatedById: userId, 
      },
    });

    return newShipment;
  });

  // 7. Publish to RabbitMQ — dispatcher consumer picks this up
  //    Fire-and-forget: shipment is already safe in DB
  //    If RabbitMQ is temporarily down, shipment still exists — a sweep job can re-publish
  publish("shipment.new", {
    shipmentId:      shipment.id,
    trackingNumber:  shipment.trackingNumber,
    merchantId:      shipment.merchantId,
    vehicleTypeId:   shipment.vehicleTypeId,
    vehicleTypeName: vehicleType.name,
    deliveryAddress: shipment.deliveryAddress,
    weight:          shipment.weight,
    isFragile:       shipment.isFragile,
    codAmount:       shipment.codAmount,
    fareSnapshot:    shipment.fareSnapshot,
    paymentType,
    createdAt:       shipment.createdAt,
  });

  return shipment;
}

// ─── Get merchant's shipments (paginated) ─────────────────────────────────────

export async function getMerchantShipments(merchantId, { page, limit, skip, status }) {
  const where = {
    merchantId,
    ...(status && { status }),
  };

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      skip,
      take: limit,
      where,
      include: {
        vehicleType: { select: { name: true } },
        rider: {
          include: { user: { select: { fullName: true, phoneNumber: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shipment.count({ where }),
  ]);

  return { shipments, ...buildPaginationMeta(total, page, limit) };
}

// ─── Get single shipment detail ───────────────────────────────────────────────

export async function getShipmentDetail(shipmentId, merchantId) {
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, merchantId },
    include: {
      vehicleType: { select: { name: true } },
      rider: {
        include: { user: { select: { fullName: true, phoneNumber: true } } },
      },
      logs: {
        include: { updatedBy: { select: { fullName: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      transaction: true,
    },
  });

  if (!shipment) throw appError(404, "Shipment not found.");
  return shipment;
}

// ─── Cancel shipment (only PENDING) ──────────────────────────────────────────

export async function cancelShipment(shipmentId, merchantId, userId) {
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, merchantId },
  });

  if (!shipment)                    throw appError(404, "Shipment not found.");
  if (shipment.status !== "PENDING") throw appError(400, "Only PENDING shipments can be cancelled.");

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.shipment.update({
      where: { id: shipmentId },
      data:  { status: "CANCELLED" },
    });

    await tx.shipmentLog.create({
      data: {
        shipmentId,
        status:      "CANCELLED",
        note:        "Cancelled by merchant",
        updatedById: userId
      },
    });

    return s;
  });

  // Notify — merchant cancellation doesn't go through RabbitMQ
  // since there's no rider assigned yet
  publish("shipment.cancelled", {
    shipmentId:     updated.id,
    trackingNumber: updated.trackingNumber,
    merchantId:     updated.merchantId,
    reason:         "Cancelled by merchant",
  });

  return updated;
}

// ─── Fare calculation ─────────────────────────────────────────────────────────

export function calculateFare(config, { weight, isFragile, codAmount, paymentType }) {
  // TODO: replace hardcoded 5km with real distance from geocode util
  // import { getDistanceKm } from "../../../utils/geocode.js";
  // const distanceKm = await getDistanceKm(pickupAddress, deliveryAddress);
  const distanceKm = 5;

  let fare = config.baseFare
    + (config.perKmRate * distanceKm)
    + (config.perKgRate * weight);

  if (isFragile)             fare += config.fragileCharge;
  if (paymentType === "COD") fare += codAmount * config.codChargeRate;

  // Night surcharge (9pm – 6am)
  const hour = new Date().getHours();
  if (hour >= 21 || hour < 6) fare += config.nightSurcharge;

  return Math.max(fare, config.minFare);
}

// ─── Tracking number generator ────────────────────────────────────────────────

function generateTrackingNumber() {
  const prefix    = "MB";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random    = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
  // Example: MB-LX4K2A-F3R9
}



