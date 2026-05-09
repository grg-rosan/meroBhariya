// payment/payment.controller.js

import { catchAsync } from "../../../utils/error/errorHandler.js";
import {
  initiateShipmentPayment,
  verifyShipmentPayment,
} from "./khalti/khalti.service.js";
import AppError from "../../../utils/error/appError.js";

/**
 * POST /merchant/payment/:shipmentId/initiate
 * Initiates Khalti payment for a shipment
 */
export const initiatePayment = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;
  const { shipmentId } = req.params;

  if (!shipmentId) throw new AppError("shipmentId is required.", 400);

  const result = await initiateShipmentPayment(shipmentId, merchantId);
  return res.status(200).json({ success: true, data: result });
});

/**
 * GET /merchant/payment/verify?pidx=xxx&shipmentId=xxx
 * Verifies Khalti payment after redirect
 */
export const verifyPayment = catchAsync(async (req, res) => {
  const merchantId        = req.merchantProfileId;
  const { pidx, shipmentId } = req.query;

  if (!pidx)       throw new AppError("pidx is required.", 400);
  if (!shipmentId) throw new AppError("shipmentId is required.", 400);

  const result = await verifyShipmentPayment(pidx, shipmentId, merchantId);
  return res.status(200).json({ success: true, data: result });
});