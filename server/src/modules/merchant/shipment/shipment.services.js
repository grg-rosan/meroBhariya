import { prisma } from "../../../config/db.config.js";
import { buildPaginationMeta } from "../../../utils/others/pagination.js";
import AppError from "../../../utils/error/appError.js";
import { calculateFare, generateTrackingNumber } from "./shipment.helpers.js";
import { parseExcelBuffer, validateRow } from "./shipment.excel.js";
import { publishShipmentNew, publishShipmentCancelled } from "./shipment.events.js";

export async function createShipment(merchantId, data, userId) {
  const {
    receiverName, receiverPhone, deliveryAddress,
    vehicleTypeId, weight, isFragile, orderValue, codAmount, paymentType,
  } = data;

  if (!receiverName || !receiverPhone || !deliveryAddress || !vehicleTypeId || !weight || !orderValue || !paymentType) {
    throw new AppError("Missing required shipment fields.", 400);
  }

  const vehicleType = await prisma.vehicleType.findFirst({
    where: { id: Number(vehicleTypeId), isActive: true },
    include: { fareConfig: true },
  });
  if (!vehicleType) throw new AppError("Vehicle type not found or inactive.", 404);
  if (!vehicleType.fareConfig) throw new AppError(`No fare config set for vehicle type: ${vehicleType.name}`, 400);
  if (weight > vehicleType.maxWeightKg) {
    throw new AppError(`Package weight ${weight}kg exceeds max ${vehicleType.maxWeightKg}kg for ${vehicleType.name}.`, 400);
  }

  const fareSnapshot = calculateFare(vehicleType.fareConfig, {
    weight, isFragile: isFragile ?? false, codAmount: codAmount ?? 0, paymentType,
  });
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

  publishShipmentNew(shipment, vehicleType, paymentType);
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
  if (!shipment) throw new AppError("Shipment not found.", 404);
  return shipment;
}

export async function cancelShipment(shipmentId, merchantId, userId) {
  const shipment = await prisma.shipment.findFirst({ where: { id: shipmentId, merchantId } });
  if (!shipment) throw new AppError("Shipment not found.", 404);
  if (shipment.status !== "PENDING") throw new AppError("Only PENDING shipments can be cancelled.", 400);

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.shipment.update({ where: { id: shipmentId }, data: { status: "CANCELLED" } });
    await tx.shipmentLog.create({
      data: { shipmentId, status: "CANCELLED", note: "Cancelled by merchant", updatedById: userId },
    });
    return s;
  });

  publishShipmentCancelled(updated);
  return updated;
}

export async function getMerchantCODLedger(merchantId) {
  const shipments = await prisma.shipment.findMany({
    where: { merchantId, codAmount: { gt: 0 } },
    include: { transaction: true, logs: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  const totalCOD = shipments.reduce((sum, s) => sum + s.codAmount, 0);
  const collected = shipments.filter((s) => s.status === "DELIVERED").reduce((sum, s) => sum + s.codAmount, 0);
  const pending = shipments.filter((s) => s.status !== "DELIVERED" && s.status !== "CANCELLED").reduce((sum, s) => sum + s.codAmount, 0);
  const remitted = shipments.filter((s) => s.transaction?.isRemitted).reduce((sum, s) => sum + s.codAmount, 0);
  return { shipments, totalCOD, collected, pending, remitted };
}

export async function bulkCreateShipments(merchantId, file, userId) {
  const rows = parseExcelBuffer(file.buffer);

  const validationErrors = rows.flatMap((row) => {
    const errs = validateRow(row);
    return errs.length ? [{ row: row._rowIndex, errors: errs }] : [];
  });
  if (validationErrors.length) throw new AppError("Validation failed", 400);

  const vehicleTypeIds = [...new Set(rows.map((r) => r.vehicleTypeId))];
  const vehicleTypes = await prisma.vehicleType.findMany({
    where: { id: { in: vehicleTypeIds }, isActive: true },
    include: { fareConfig: true },
  });
  const vehicleTypeMap = Object.fromEntries(vehicleTypes.map((v) => [v.id, v]));

  const missingTypes = vehicleTypeIds.filter((id) => !vehicleTypeMap[id]);
  if (missingTypes.length) throw new AppError(`Invalid or inactive vehicleTypeIds: ${missingTypes.join(", ")}`, 400);

  const created = await prisma.$transaction(async (tx) => {
    const results = [];
    for (const row of rows) {
      const { _rowIndex, ...data } = row;
      const vehicleType = vehicleTypeMap[data.vehicleTypeId];
      if (data.weight > vehicleType.maxWeightKg) {
        throw new AppError(`Row ${_rowIndex}: weight ${data.weight}kg exceeds max ${vehicleType.maxWeightKg}kg for ${vehicleType.name}`, 400);
      }
      const fareSnapshot = calculateFare(vehicleType.fareConfig, data);
      const trackingNumber = generateTrackingNumber();
      const shipment = await tx.shipment.create({
        data: {
          trackingNumber, merchantId, vehicleTypeId: data.vehicleTypeId,
          receiverName: data.receiverName, receiverPhone: data.receiverPhone,
          deliveryAddress: data.deliveryAddress, weight: data.weight,
          isFragile: data.isFragile, orderValue: data.orderValue,
          codAmount: data.codAmount, fareSnapshot, status: "PENDING",
        },
      });
      await tx.shipmentLog.create({
        data: { shipmentId: shipment.id, status: "PENDING", note: "Created via bulk upload", updatedById: userId },
      });
      results.push(shipment);
    }
    return results;
  });

  created.forEach((shipment, i) => publishShipmentNew(shipment, vehicleTypeMap[shipment.vehicleTypeId], rows[i].paymentType));

  return {
    total: created.length,
    created: created.map((s) => ({ id: s.id, trackingNumber: s.trackingNumber, receiverName: s.receiverName, status: s.status })),
  };
}