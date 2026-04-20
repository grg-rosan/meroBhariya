<<<<<<< HEAD
// src/modules/merchant/shipment/shipment.service.js
import { prisma }       from "../../../config/db.config.js";
import { publish} from "../../../infrastructure/rabbitmq/publisher.js";
import { EXCHANGE } from "../../../infrastructure/rabbitmq/queue.js";
import  AppError     from "../../../utils/error/appError.js";
import { buildPaginationMeta } from "../../../utils/others/pagination.js";
=======
import { prisma } from "../../../config/db.config.js";
import { publish } from "../../../infrastructure/rabbitmq/publisher.js";
import { appError } from "../../../utils/errorHandler.js";
import { buildPaginationMeta } from "../../../utils/pagination.js";
>>>>>>> origin/merchant

export async function createShipment(merchantId, data, userId) {
  const { receiverName, receiverPhone, deliveryAddress, vehicleTypeId, weight, isFragile, orderValue, codAmount, paymentType } = data;
  if (!receiverName || !receiverPhone || !deliveryAddress || !vehicleTypeId || !weight || !orderValue || !paymentType) {
    throw AppError(400, "Missing required shipment fields.");
  }
  const vehicleType = await prisma.vehicleType.findFirst({
    where: { id: Number(vehicleTypeId), isActive: true },
    include: { fareConfig: true },
  });
<<<<<<< HEAD
  if (!vehicleType)            throw AppError(404, "Vehicle type not found or inactive.");
  if (!vehicleType.fareConfig) throw AppError(400, `No fare config set for vehicle type: ${vehicleType.name}`);

  // 3. Weight check
=======
  if (!vehicleType) throw appError(404, "Vehicle type not found or inactive.");
  if (!vehicleType.fareConfig) throw appError(400, `No fare config set for vehicle type: ${vehicleType.name}`);
>>>>>>> origin/merchant
  if (weight > vehicleType.maxWeightKg) {
    throw AppError(400, `Package weight ${weight}kg exceeds max ${vehicleType.maxWeightKg}kg for ${vehicleType.name}.`);
  }
  const fareSnapshot = calculateFare(vehicleType.fareConfig, { weight, isFragile: isFragile ?? false, codAmount: codAmount ?? 0, paymentType });
  const trackingNumber = generateTrackingNumber();
  const shipment = await prisma.$transaction(async (tx) => {
    const newShipment = await tx.shipment.create({
      data: {
        trackingNumber, merchantId, vehicleTypeId: Number(vehicleTypeId),
        receiverName, receiverPhone, deliveryAddress,
        weight: Number(weight), isFragile: isFragile ?? false,
        orderValue: Number(orderValue), codAmount: Number(codAmount ?? 0),
        fareSnapshot, status: "PENDING",
      },
    });
    await tx.shipmentLog.create({
      data: { shipmentId: newShipment.id, status: "PENDING", note: "Shipment created by merchant", updatedById: userId },
    });
    return newShipment;
  });
  publish("shipment.new", {
    shipmentId: shipment.id, trackingNumber: shipment.trackingNumber,
    merchantId: shipment.merchantId, vehicleTypeId: shipment.vehicleTypeId,
    vehicleTypeName: vehicleType.name, deliveryAddress: shipment.deliveryAddress,
    weight: shipment.weight, isFragile: shipment.isFragile,
    codAmount: shipment.codAmount, fareSnapshot: shipment.fareSnapshot,
    paymentType, createdAt: shipment.createdAt,
  });
  return shipment;
}

export async function getMerchantShipments(merchantId, { page, limit, skip, status }) {
  const where = { merchantId, ...(status && { status }) };
  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      skip, take: limit, where,
      include: {
        vehicleType: { select: { name: true } },
        rider: { include: { user: { select: { fullName: true, phoneNumber: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shipment.count({ where }),
  ]);
  return { shipments, ...buildPaginationMeta(total, page, limit) };
}

export async function getShipmentDetail(shipmentId, merchantId) {
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, merchantId },
    include: {
      vehicleType: { select: { name: true } },
      rider: { include: { user: { select: { fullName: true, phoneNumber: true } } } },
      logs: { include: { updatedBy: { select: { fullName: true, role: true } } }, orderBy: { createdAt: "asc" } },
      transaction: true,
    },
  });
<<<<<<< HEAD

  if (!shipment) throw AppError(404, "Shipment not found.");
=======
  if (!shipment) throw appError(404, "Shipment not found.");
>>>>>>> origin/merchant
  return shipment;
}

export async function cancelShipment(shipmentId, merchantId, userId) {
<<<<<<< HEAD
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, merchantId },
  });

  if (!shipment)                    throw AppError(404, "Shipment not found.");
  if (shipment.status !== "PENDING") throw AppError(400, "Only PENDING shipments can be cancelled.");

=======
  const shipment = await prisma.shipment.findFirst({ where: { id: shipmentId, merchantId } });
  if (!shipment) throw appError(404, "Shipment not found.");
  if (shipment.status !== "PENDING") throw appError(400, "Only PENDING shipments can be cancelled.");
>>>>>>> origin/merchant
  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.shipment.update({ where: { id: shipmentId }, data: { status: "CANCELLED" } });
    await tx.shipmentLog.create({
      data: { shipmentId, status: "CANCELLED", note: "Cancelled by merchant", updatedById: userId },
    });
    return s;
  });
  publish("shipment.cancelled", {
    shipmentId: updated.id, trackingNumber: updated.trackingNumber,
    merchantId: updated.merchantId, reason: "Cancelled by merchant",
  });
  return updated;
}

export async function getMerchantCODLedger(merchantId) {
  const shipments = await prisma.shipment.findMany({
    where: { merchantId, codAmount: { gt: 0 } },
    include: { transaction: true, logs: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  const totalCOD  = shipments.reduce((sum, s) => sum + s.codAmount, 0);
  const collected = shipments.filter(s => s.status === "DELIVERED").reduce((sum, s) => sum + s.codAmount, 0);
  const pending   = shipments.filter(s => s.status !== "DELIVERED" && s.status !== "CANCELLED").reduce((sum, s) => sum + s.codAmount, 0);
  const remitted  = shipments.filter(s => s.transaction?.isRemitted).reduce((sum, s) => sum + s.codAmount, 0);
  return { shipments, totalCOD, collected, pending, remitted };
}

export function calculateFare(config, { weight, isFragile, codAmount, paymentType }) {
  const distanceKm = 5;
  let fare = config.baseFare + (config.perKmRate * distanceKm) + (config.perKgRate * weight);
  if (isFragile) fare += config.fragileCharge;
  if (paymentType === "COD") fare += codAmount * config.codChargeRate;
  const hour = new Date().getHours();
  if (hour >= 21 || hour < 6) fare += config.nightSurcharge;
  return Math.max(fare, config.minFare);
}

function generateTrackingNumber() {
  const prefix = "MB";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}