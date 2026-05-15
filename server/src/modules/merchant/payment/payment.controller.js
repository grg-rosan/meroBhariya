import logger from "../../../utils/logger.js";
import { catchAsync } from "../../../utils/error/errorHandler.js";
import {
  initiateExistingShipmentPayment,
  initiatePaymentSession,
  verifyAndCreateShipment,
} from "./payment.service.js";
import AppError from "../../../utils/error/appError.js";

export const initiatePayment = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;

  logger.info({ merchantId, userId: req.userId }, "Payment initiation requested");

  const ctx = {
    fare:        req.fare,
    zone:        req.zone,
    distanceKm:  req.distanceKm,
    deliveryLat: req.deliveryLat,
    deliveryLng: req.deliveryLng,
  };

  const result = await initiatePaymentSession(merchantId, req.userId, req.body, ctx);
  return res.status(201).json({ success: true, data: result });
});

export const initiateExistingPayment = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;
  const { shipmentId } = req.params;

  logger.info(
    { merchantId, userId: req.userId, shipmentId },
    "Existing shipment payment initiation requested",
  );

  const result = await initiateExistingShipmentPayment(
    merchantId,
    req.userId,
    shipmentId,
  );
  return res.status(201).json({ success: true, data: result });
});

export const verifyPayment = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;
  const pidx = req.query.pidx?.trim();

  if (!pidx) throw new AppError("pidx is required.", 400);

  logger.info({ merchantId, userId: req.userId, pidx }, "Payment verification requested");

  const result = await verifyAndCreateShipment(pidx, merchantId, req.userId);
  return res.status(201).json({ success: true, data: result });
});
