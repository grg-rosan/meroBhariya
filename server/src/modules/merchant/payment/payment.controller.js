import { catchAsync } from "../../../utils/error/errorHandler.js";
import {
  initiatePaymentSession,
  verifyAndCreateShipment,
} from "./payment.service.js";
import AppError from "../../../utils/error/appError.js";

export const initiatePayment = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;
  const ctx = {
    fare:        req.fare,
    zone:        req.zone,
    distanceKm:  req.distanceKm,
    deliveryLat: req.deliveryLat,
    deliveryLng: req.deliveryLng,
  };
  const result = await initiatePaymentSession(merchantId, req.userId, req.body, ctx);
  return res.status(200).json({ success: true, data: result });
});

export const verifyPayment = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;
  const { pidx }   = req.query;
  if (!pidx) throw new AppError("pidx is required.", 400);

  const result = await verifyAndCreateShipment(pidx, merchantId, req.userId);
  return res.status(201).json({ success: true, data: result });
});