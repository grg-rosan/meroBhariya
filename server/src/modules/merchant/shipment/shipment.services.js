// shipment/shipment.services.js

import QRCode from "qrcode";
import { prisma } from "../../../config/db.config.js";
import AppError from "../../../utils/error/appError.js";
import { buildPaginationMeta } from "../../../utils/others/pagination.js";
import { generateTrackingNumber } from "./shipment.helpers.js";
import { parseExcelBuffer, validateRow } from "./shipment.excel.js";
import {
  publishShipmentNew,
  publishShipmentCancelled,
} from "./shipment.events.js";
import {
  publish,
  publishMerchantNotification,
} from "../../../infrastructure/rabbitmq/publisher.js";

// ── createShipment ────────────────────────────────────────────
export async function createShipment(merchantId, data, userId, ctx) {
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
    fromDistrictId,
    toDistrictId,
  } = data;

  const { vehicleType, distanceKm, deliveryLat, deliveryLng, fare, zone } = ctx;

  // ── Required field guard ──────────────────────────────────
  if (
    !receiverName ||
    !receiverPhone ||
    !deliveryAddress ||
    !vehicleTypeId ||
    !weight ||
    !orderValue ||
    !paymentType
  ) {
    throw new AppError("Missing required shipment fields.", 400);
  }
  if (!fromDistrictId || !toDistrictId) {
    throw new AppError("fromDistrictId and toDistrictId are required.", 400);
  }

  // ── COD / PREPAID validation ──────────────────────────────
  if (paymentType === "COD") {
    if (!codAmount || Number(codAmount) <= 0) {
      throw new AppError(
        "codAmount is required and must be greater than 0 for COD shipments.",
        400,
      );
    }
    if (Number(codAmount) > Number(orderValue)) {
      throw new AppError("codAmount cannot exceed orderValue.", 400);
    }
  }
  // For PREPAID — codAmount is forced to 0 regardless of what was sent
  const resolvedCodAmount = paymentType === "COD" ? Number(codAmount) : 0;

  const trackingNumber = generateTrackingNumber();

  const shipment = await prisma.$transaction(async (tx) => {
    // 1. Create shipment — UNPAID until Khalti payment verified
    const newShipment = await tx.shipment.create({
      data: {
        trackingNumber,
        merchantId,
        vehicleTypeId: Number(vehicleTypeId),
        receiverName,
        receiverPhone,
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        fromDistrictId: Number(fromDistrictId),
        toDistrictId: Number(toDistrictId),
        zoneId: zone.id,

        weight: Number(weight),
        isFragile: isFragile ?? false,
        orderValue: Number(orderValue),
        codAmount: resolvedCodAmount,
        paymentType,

        distanceKm,
        baseFare: fare.baseFare,
        distanceFare: fare.distanceFare,
        weightFare: fare.weightFare,
        fragileCharge: fare.fragileCharge,
        zoneSurcharge: fare.zoneSurcharge,
        codFee: fare.codFee,
        insuranceFee: fare.insuranceFee,
        totalFare: fare.totalFare,
        fareSnapshot: fare.totalFare,

        status: "UNPAID",
      },
    });

    // Set PostGIS delivery location via raw SQL
// WITH THIS
await tx.$executeRaw`UPDATE "Shipment" SET "deliveryLocation" = ST_SetSRID(ST_MakePoint(${deliveryLng}::float8, ${deliveryLat}::float8), 4326) WHERE id = ${newShipment.id}`;    // 2. Shipment log
    await tx.shipmentLog.create({
      data: {
        shipmentId: newShipment.id,
        status: "UNPAID",
        note: `Shipment created. Awaiting payment. Distance: ${distanceKm.toFixed(2)}km. Zone: ${zone.name}. Fare: NPR ${fare.totalFare}${fare.codFee > 0 ? ` (incl. COD fee: NPR ${fare.codFee})` : ""}`,
        updatedById: userId,
      },
    });

    // 3. COD record — created now so rider + admin can track collection
    //    status starts PENDING — moves to COLLECTED when rider delivers
    if (paymentType === "COD" && resolvedCodAmount > 0) {
      await tx.cODRecord.create({
        data: {
          shipmentId: newShipment.id,
          amount: resolvedCodAmount,
          status: "PENDING",
        },
      });
    }

    return newShipment;
  });

  const qrCode = await QRCode.toDataURL(shipment.trackingNumber);
  publishShipmentNew(shipment, vehicleType, paymentType);

  const { insuranceFee, ...safeShipment } = shipment;

  return {
    ...safeShipment,
    qrCode,
    fareBreakdown: {
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      zone: zone.name,
      baseFare: fare.baseFare,
      distanceFare: fare.distanceFare,
      weightFare: fare.weightFare,
      fragileCharge: fare.fragileCharge,
      zoneSurcharge: fare.zoneSurcharge,
      codFee: fare.codFee, // shown to merchant
      totalFare: fare.totalFare, // insuranceFee NOT included in label
    },
  };
}
// ── getMerchantShipments ──────────────────────────────────────

export async function getMerchantShipments(
  merchantId,
  { page, limit, skip, status },
) {
  const where = { merchantId, ...(status && { status }) };

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      skip,
      take: limit,
      where,
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        receiverName: true,
        receiverPhone: true,
        deliveryAddress: true,
        weight: true,
        totalFare: true,
        paymentType: true,
        codAmount: true,
        distanceKm: true,
        createdAt: true,
        // insuranceFee excluded
        fromDistrict: { select: { name: true } },
        toDistrict: { select: { name: true } },
        zone: { select: { name: true } },
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

// ── getShipmentDetail ─────────────────────────────────────────

export async function getShipmentDetail(shipmentId, merchantId) {
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, merchantId },
    select: {
      id: true,
      trackingNumber: true,
      status: true,
      receiverName: true,
      receiverPhone: true,
      deliveryAddress: true,
      deliveryLat: true,
      deliveryLng: true,
      weight: true,
      isFragile: true,
      orderValue: true,
      codAmount: true,
      paymentType: true,
      distanceKm: true,
      baseFare: true,
      distanceFare: true,
      weightFare: true,
      fragileCharge: true,
      zoneSurcharge: true,
      totalFare: true, // insuranceFee excluded
      fareSnapshot: true,
      createdAt: true,
      updatedAt: true,
      fromDistrict: { select: { name: true, province: true } },
      toDistrict: { select: { name: true, province: true } },
      zone: { select: { name: true, description: true } },
      vehicleType: { select: { name: true } },
      rider: {
        include: { user: { select: { fullName: true, phoneNumber: true } } },
      },
      logs: {
        include: { updatedBy: { select: { fullName: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      transaction: true,
      khaltiPayment: {
        select: { status: true, pidx: true, completedAt: true, amount: true },
      },
    },
  });

  if (!shipment) throw new AppError("Shipment not found.", 404);
  return shipment;
}

// ── cancelShipment ────────────────────────────────────────────

export async function cancelShipment(shipmentId, merchantId, userId) {
  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, merchantId },
  });
  if (!shipment) throw new AppError("Shipment not found.", 404);
  if (shipment.status !== "PENDING") {
    throw new AppError("Only PENDING shipments can be cancelled.", 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const s = await tx.shipment.update({
      where: { id: shipmentId },
      data: { status: "CANCELLED" },
    });
    await tx.shipmentLog.create({
      data: {
        shipmentId,
        status: "CANCELLED",
        note: "Cancelled by merchant",
        updatedById: userId,
      },
    });
    return s;
  });

  publishShipmentCancelled(updated);
  return updated;
}

// ── getMerchantCODLedger ──────────────────────────────────────

export async function getMerchantCODLedger(merchantId) {
  const shipments = await prisma.shipment.findMany({
    where: { merchantId, codAmount: { gt: 0 } },
    include: { transaction: true, logs: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const totalCOD = shipments.reduce((sum, s) => sum + s.codAmount, 0);
  const collected = shipments
    .filter((s) => s.status === "DELIVERED")
    .reduce((sum, s) => sum + s.codAmount, 0);
  const pending = shipments
    .filter((s) => !["DELIVERED", "CANCELLED"].includes(s.status))
    .reduce((sum, s) => sum + s.codAmount, 0);
  const remitted = shipments
    .filter((s) => s.transaction?.isRemitted)
    .reduce((sum, s) => sum + s.codAmount, 0);

  return { shipments, totalCOD, collected, pending, remitted };
}

// ── bulkCreateShipments ───────────────────────────────────────
// Note: bulk upload uses Excel rows — no zone/distance for now
// Each row needs fromDistrictId + toDistrictId in future
// For now: fareConfig based calculation only (Phase 1)

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
  if (missingTypes.length) {
    throw new AppError(
      `Invalid or inactive vehicleTypeIds: ${missingTypes.join(", ")}`,
      400,
    );
  }

  const created = await prisma.$transaction(async (tx) => {
    const results = [];
    for (const row of rows) {
      const { _rowIndex, ...data } = row;
      const vehicleType = vehicleTypeMap[data.vehicleTypeId];

      if (data.weight > vehicleType.maxWeightKg) {
        throw new AppError(
          `Row ${_rowIndex}: weight ${data.weight}kg exceeds max ${vehicleType.maxWeightKg}kg for ${vehicleType.name}`,
          400,
        );
      }

      const trackingNumber = generateTrackingNumber();
      const shipment = await tx.shipment.create({
        data: {
          trackingNumber,
          merchantId,
          vehicleTypeId: data.vehicleTypeId,
          receiverName: data.receiverName,
          receiverPhone: data.receiverPhone,
          deliveryAddress: data.deliveryAddress,
          weight: data.weight,
          isFragile: data.isFragile,
          orderValue: data.orderValue,
          codAmount: data.codAmount,
          paymentType: data.paymentType,
          status: "PENDING",
          // TODO Phase 2: add fromDistrictId, toDistrictId, zone, fare breakdown
        },
      });

      await tx.shipmentLog.create({
        data: {
          shipmentId: shipment.id,
          status: "PENDING",
          note: "Created via bulk upload",
          updatedById: userId,
        },
      });

      results.push(shipment);
    }
    return results;
  });

  created.forEach((s, i) =>
    publishShipmentNew(s, vehicleTypeMap[s.vehicleTypeId], rows[i].paymentType),
  );

  return {
    total: created.length,
    created: created.map((s) => ({
      id: s.id,
      trackingNumber: s.trackingNumber,
      receiverName: s.receiverName,
      status: s.status,
    })),
  };
}

export async function deliverShipment(shipmentId, userId, { codCollected, podNote }) {
  const riderProfile = await prisma.riderProfile.findUnique({
    where:  { userId },
    select: { id: true },
  });
  if (!riderProfile) throw new AppError("Rider profile not found.", 404);

  const shipment = await prisma.shipment.findUnique({
    where:  { id: shipmentId },
    select: {
      id:          true,
      riderId:     true,
      status:      true,
      paymentType: true,
      totalFare:   true,
      fareSnapshot:true,
      codAmount:   true,
      merchant:    { select: { userId: true } },
    },
  });
  if (!shipment)                          throw new AppError("Shipment not found.", 404);
  if (shipment.riderId !== riderProfile.id) throw new AppError("Not assigned to you.", 403);
  if (shipment.status !== "OUT_FOR_DELIVERY")
    throw new AppError(`Cannot deliver — status is ${shipment.status}.`, 400);

  const totalFare = Number(shipment.totalFare ?? shipment.fareSnapshot ?? 0);

  const [updated] = await prisma.$transaction([
    prisma.shipment.update({
      where:  { id: shipmentId },
      data:   { status: "DELIVERED" },
      select: { id: true, trackingNumber: true, status: true },
    }),
    prisma.shipmentLog.create({
      data: {
        shipmentId,
        status:      "DELIVERED",
        note:        podNote ?? null,
        updatedById: userId,
      },
    }),
    prisma.transaction.upsert({
      where:  { shipmentId },
      update: { collectedByRider: codCollected ?? 0 },
      create: {
        shipmentId,
        paymentType:      shipment.paymentType,   // "PREPAID" or "COD"
        totalFare,                                 // 777.03
        codAmount:        Number(shipment.codAmount ?? 0),
        collectedByRider: codCollected ?? 0,
        isRemitted:       false,
      },
    }),
  ]);

  publishMerchantNotification({
    merchantUserId: shipment.merchant.userId,
    shipmentId:     updated.id,
    trackingNumber: updated.trackingNumber,
    status:         "DELIVERED",
    message:        `Your shipment ${updated.trackingNumber} has been delivered.`,
  });

  publish("shipment.delivered", {
    shipmentId:     updated.id,
    trackingNumber: updated.trackingNumber,
    codCollected:   codCollected ?? 0,
  });

  return updated;
}