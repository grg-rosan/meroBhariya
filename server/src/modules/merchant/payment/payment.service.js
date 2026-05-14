import { prisma } from "../../../config/db.config.js";
import { getRedisClient } from "../../../config/redis.config.js";
import AppError from "../../../utils/error/appError.js";
import * as khalti from "../../../utils/services/khaltiClient.js";
import { generateTrackingNumber } from "../shipment/shipment.helpers.js";
import QRCode from "qrcode";
import { publishShipmentNew } from "../shipment/shipment.events.js";
import { khaltiConfig } from "../../../config/khalti.config.js";
const SESSION_TTL = 60 * 30; // 30 minutes

// ── initiatePaymentSession ────────────────────────────────────
// Stores form data + fare in Redis, initiates Khalti payment
// No shipment created yet

export async function initiatePaymentSession(merchantId, userId, body, ctx) {
  const redis = await getRedisClient();
  const { fare, zone, distanceKm, deliveryLat, deliveryLng } = ctx;
  // Store everything needed to create shipment later
  const sessionToken = crypto.randomUUID();
  const sessionData = JSON.stringify({
    merchantId,
    userId,
    body,
    ctx: {
      fare,
      zone,
      distanceKm,
      deliveryLat,
      deliveryLng,
    },
  });

  await redis.set(
    `pay_session:${sessionToken}`,
    sessionData,
    "EX",
    SESSION_TTL,
  );

  const totalAmount = Number(fare.totalFare);
  if (!totalAmount || isNaN(totalAmount) || totalAmount <= 0) {
    throw new AppError("Invalid fare amount", 400);
  }
  const amountPaisa = Math.round(totalAmount * 100);

  const khaltiRes = await khalti.requestKhaltiInitiate({
    return_url: khaltiConfig.returnUrl,
    website_url: khaltiConfig.websiteUrl,
    amount: amountPaisa,
    purchase_order_id: sessionToken, // ← session token, not shipment id
    purchase_order_name: `meroBhariya Delivery - ${zone.name} zone`,
  });
  // Store pidx → sessionToken mapping for verify step
  await redis.set(
    `pay_pidx:${khaltiRes.pidx}`,
    sessionToken,
    "EX",
    SESSION_TTL,
  );
  logger.info(
    { pidx: khaltiRes.pidx, sessionToken, userId, merchantId, amountPaisa },
    "Khalti payment session initiated",
  );
  return {
    paymentUrl: khaltiRes.payment_url,
    pidx: khaltiRes.pidx,
    totalFare: totalAmount,
    zone: zone.name,
  };
}

export async function verifyAndCreateShipment(pidx, merchantId, userId) {
  const existing = await prisma.khaltiPayment.findUnique({ where: { pidx } });
  if (existing) {
    throw new AppError("Payment already verified.", 409);
  }
  // 1. Look up session
  const redis = await getRedisClient();
  const sessionToken = await redis.get(`pay_pidx:${pidx}`);
  if (!sessionToken)
    throw new AppError("Payment session expired or not found.", 404);

  const raw = await redis.get(`pay_session:${sessionToken}`);
  if (!raw) throw new AppError("Payment session data expired.", 404);

  const session = JSON.parse(raw);
  // 2. Verify with Khalti
  const khaltiRes = await khalti.requestKhaltiLookup(pidx);
  if (khaltiRes.status !== "Completed") {
    throw new AppError(
      `Payment not completed. Khalti status: ${khaltiRes.status}`,
      402,
    );
  }

  // 3. Create shipment now that payment is confirmed
  const { body, ctx } = session;
  const { fare, zone, distanceKm, deliveryLat, deliveryLng } = ctx;

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
  } = body;
  logger.debug({ body }, "Verified session body");

  const resolvedCodAmount = paymentType === "COD" ? Number(codAmount) : 0;
  const trackingNumber = generateTrackingNumber();

  const shipment = await prisma.$transaction(async (tx) => {
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
        status: "PENDING", // ← born as PENDING, never UNPAID
      },
    });

    await tx.$executeRaw`UPDATE "Shipment" SET "deliveryLocation" = ST_SetSRID(ST_MakePoint(${deliveryLng}::float8, ${deliveryLat}::float8), 4326) WHERE id = ${newShipment.id}`;

    // Khalti payment record
    await tx.khaltiPayment.create({
      data: {
        merchantId,
        shipmentId: newShipment.id,
        amount: Number(fare.totalFare),
        pidx,
        txnId: khaltiRes.transaction_id,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Transaction record
    await tx.transaction.create({
      data: {
        shipmentId: newShipment.id,
        paymentType,
        totalFare: Number(fare.totalFare),
        codAmount: resolvedCodAmount,
        collectedByRider: 0,
        isRemitted: false,
      },
    });
    logger.info(
      { shipmentId: shipment.id, trackingNumber, pidx, userId, merchantId },
      "Shipment created after Khalti payment verification",
    );
    // COD record
    if (paymentType === "COD" && resolvedCodAmount > 0) {
      await tx.cODRecord.create({
        data: {
          shipmentId: newShipment.id,
          amount: resolvedCodAmount,
          status: "PENDING",
        },
      });
    }

    // Shipment log
    await tx.shipmentLog.create({
      data: {
        shipmentId: newShipment.id,
        status: "PENDING",
        note: `Payment verified via Khalti. txnId: ${khaltiRes.transaction_id}`,
        updatedById: userId,
      },
    });

    return newShipment;
  });

  const qrCode = await QRCode.toDataURL(shipment.trackingNumber);
  try {
    await publishShipmentNew(shipment, vehicleType, paymentType);
  } catch (err) {
    logger.warn(
      { err, shipmentId: shipment.id },
      "Shipment publish event failed — non-critical",
    );
  }
  if (!vehicleType) {
    logger.warn(
      { vehicleTypeId },
      "Vehicle type not found after shipment creation",
    );
  }
  await redis.del(`pay_pidx:${pidx}`);
  await redis.del(`pay_session:${sessionToken}`);

  return {
    verified: true,
    shipmentId: shipment.id,
    trackingNumber: shipment.trackingNumber,
    totalFare: Number(fare.totalFare),
    qrCode,
  };
}
