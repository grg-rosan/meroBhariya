// shipment/shipment.services.js

import QRCode    from "qrcode";
import { prisma } from "../../../config/db.config.js";
import AppError   from "../../../utils/error/appError.js";
import { buildPaginationMeta }                from "../../../utils/others/pagination.js";
import { generateTrackingNumber }             from "./shipment.helpers.js";
import { parseExcelBuffer, validateRow }      from "./shipment.excel.js";
import { publishShipmentNew, publishShipmentCancelled } from "./shipment.events.js";

// ── createShipment ────────────────────────────────────────────
// ctx is populated by computeFare middleware
// No wallet, no subscription — pure pay-per-shipment

export async function createShipment(merchantId, data, userId, ctx) {
  const {
    receiverName, receiverPhone, deliveryAddress,
    vehicleTypeId, weight, isFragile,
    orderValue, codAmount, paymentType,
    fromDistrictId, toDistrictId,
  } = data;

  const {
    vehicleType,
    distanceKm,
    deliveryLat,
    deliveryLng,
    fare,       // full breakdown from computeFare middleware
    zone,
    fromDistrict,
    toDistrict,
  } = ctx;

  if (!receiverName || !receiverPhone || !deliveryAddress || !vehicleTypeId || !weight || !orderValue || !paymentType) {
    throw new AppError("Missing required shipment fields.", 400);
  }
  if (!fromDistrictId || !toDistrictId) {
    throw new AppError("fromDistrictId and toDistrictId are required.", 400);
  }

  const trackingNumber = generateTrackingNumber();

  const shipment = await prisma.$transaction(async (tx) => {
    // 1. Create shipment with full fare breakdown
    const newShipment = await tx.shipment.create({
      data: {
        trackingNumber,
        merchantId,
        vehicleTypeId:   Number(vehicleTypeId),
        receiverName,
        receiverPhone,
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        deliveryLocation: `SRID=4326;POINT(${deliveryLng} ${deliveryLat})`,

        // Districts + Zone
        fromDistrictId:  Number(fromDistrictId),
        toDistrictId:    Number(toDistrictId),
        zoneId:          zone.id,

        // Shipment details
        weight:      Number(weight),
        isFragile:   isFragile ?? false,
        orderValue:  Number(orderValue),
        codAmount:   Number(codAmount ?? 0),
        paymentType,

        // Fare breakdown — all frozen at creation
        distanceKm,
        baseFare:      fare.baseFare,
        distanceFare:  fare.distanceFare,
        weightFare:    fare.weightFare,
        fragileCharge: fare.fragileCharge,
        zoneSurcharge: fare.zoneSurcharge,
        insuranceFee:  fare.insuranceFee,  // internal only
        totalFare:     fare.totalFare,
        fareSnapshot:  fare.totalFare,     // legacy compat

        status: "PENDING",
      },
    });

    // 2. Shipment log
    await tx.shipmentLog.create({
      data: {
        shipmentId:  newShipment.id,
        status:      "PENDING",
        note:        `Shipment created. Distance: ${distanceKm.toFixed(2)}km. Zone: ${zone.name}. Fare: NPR ${fare.totalFare}`,
        updatedById: userId,
      },
    });

    // 3. COD record if applicable
    if (paymentType === "COD" && Number(codAmount ?? 0) > 0) {
      await tx.cODRecord.create({
        data: {
          shipmentId: newShipment.id,
          amount:     Number(codAmount),
          status:     "PENDING",
        },
      });
    }

    return newShipment;
  });

  // Generate QR code from tracking number
  const qrCode = await QRCode.toDataURL(shipment.trackingNumber);

  publishShipmentNew(shipment, vehicleType, paymentType);

  // Strip insuranceFee from response — internal only
  const { insuranceFee, ...safeShipment } = shipment;

  return {
    ...safeShipment,
    qrCode,
    fareBreakdown: {
      distanceKm:    parseFloat(distanceKm.toFixed(2)),
      zone:          zone.name,
      baseFare:      fare.baseFare,
      distanceFare:  fare.distanceFare,
      weightFare:    fare.weightFare,
      fragileCharge: fare.fragileCharge,
      zoneSurcharge: fare.zoneSurcharge,
      totalFare:     fare.totalFare,   // insuranceFee NOT included here
    },
  };
}

// ── getMerchantShipments ──────────────────────────────────────

export async function getMerchantShipments(merchantId, { page, limit, skip, status }) {
  const where = { merchantId, ...(status && { status }) };

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      skip, take: limit, where,
      select: {
        id: true, trackingNumber: true, status: true,
        receiverName: true, receiverPhone: true, deliveryAddress: true,
        weight: true, totalFare: true, paymentType: true, codAmount: true,
        distanceKm: true, createdAt: true,
        // insuranceFee excluded
        fromDistrict: { select: { name: true } },
        toDistrict:   { select: { name: true } },
        zone:         { select: { name: true } },
        vehicleType:  { select: { name: true } },
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
      id: true, trackingNumber: true, status: true,
      receiverName: true, receiverPhone: true, deliveryAddress: true,
      deliveryLat: true, deliveryLng: true,
      weight: true, isFragile: true, orderValue: true,
      codAmount: true, paymentType: true,
      distanceKm: true, baseFare: true, distanceFare: true,
      weightFare: true, fragileCharge: true, zoneSurcharge: true,
      totalFare: true,    // insuranceFee excluded
      fareSnapshot: true,
      createdAt: true, updatedAt: true,
      fromDistrict:  { select: { name: true, province: true } },
      toDistrict:    { select: { name: true, province: true } },
      zone:          { select: { name: true, description: true } },
      vehicleType:   { select: { name: true } },
      rider: {
        include: { user: { select: { fullName: true, phoneNumber: true } } },
      },
      logs: {
        include: { updatedBy: { select: { fullName: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      transaction:    true,
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
      data:  { status: "CANCELLED" },
    });
    await tx.shipmentLog.create({
      data: { shipmentId, status: "CANCELLED", note: "Cancelled by merchant", updatedById: userId },
    });
    return s;
  });

  publishShipmentCancelled(updated);
  return updated;
}

// ── getMerchantCODLedger ──────────────────────────────────────

export async function getMerchantCODLedger(merchantId) {
  const shipments = await prisma.shipment.findMany({
    where:   { merchantId, codAmount: { gt: 0 } },
    include: { transaction: true, logs: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const totalCOD   = shipments.reduce((sum, s) => sum + s.codAmount, 0);
  const collected  = shipments.filter((s) => s.status === "DELIVERED").reduce((sum, s) => sum + s.codAmount, 0);
  const pending    = shipments.filter((s) => !["DELIVERED", "CANCELLED"].includes(s.status)).reduce((sum, s) => sum + s.codAmount, 0);
  const remitted   = shipments.filter((s) => s.transaction?.isRemitted).reduce((sum, s) => sum + s.codAmount, 0);

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
  const vehicleTypes   = await prisma.vehicleType.findMany({
    where:   { id: { in: vehicleTypeIds }, isActive: true },
    include: { fareConfig: true },
  });
  const vehicleTypeMap = Object.fromEntries(vehicleTypes.map((v) => [v.id, v]));

  const missingTypes = vehicleTypeIds.filter((id) => !vehicleTypeMap[id]);
  if (missingTypes.length) {
    throw new AppError(`Invalid or inactive vehicleTypeIds: ${missingTypes.join(", ")}`, 400);
  }

  const created = await prisma.$transaction(async (tx) => {
    const results = [];
    for (const row of rows) {
      const { _rowIndex, ...data } = row;
      const vehicleType = vehicleTypeMap[data.vehicleTypeId];

      if (data.weight > vehicleType.maxWeightKg) {
        throw new AppError(
          `Row ${_rowIndex}: weight ${data.weight}kg exceeds max ${vehicleType.maxWeightKg}kg for ${vehicleType.name}`,
          400
        );
      }

      const trackingNumber = generateTrackingNumber();
      const shipment = await tx.shipment.create({
        data: {
          trackingNumber, merchantId,
          vehicleTypeId:   data.vehicleTypeId,
          receiverName:    data.receiverName,
          receiverPhone:   data.receiverPhone,
          deliveryAddress: data.deliveryAddress,
          weight:          data.weight,
          isFragile:       data.isFragile,
          orderValue:      data.orderValue,
          codAmount:       data.codAmount,
          paymentType:     data.paymentType,
          status:          "PENDING",
          // TODO Phase 2: add fromDistrictId, toDistrictId, zone, fare breakdown
        },
      });

      await tx.shipmentLog.create({
        data: {
          shipmentId:  shipment.id,
          status:      "PENDING",
          note:        "Created via bulk upload",
          updatedById: userId,
        },
      });

      results.push(shipment);
    }
    return results;
  });

  created.forEach((s, i) =>
    publishShipmentNew(s, vehicleTypeMap[s.vehicleTypeId], rows[i].paymentType)
  );

  return {
    total:   created.length,
    created: created.map((s) => ({
      id: s.id, trackingNumber: s.trackingNumber,
      receiverName: s.receiverName, status: s.status,
    })),
  };
}