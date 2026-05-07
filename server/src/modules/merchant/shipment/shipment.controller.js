import * as shipmentService from "./shipment.services.js";
import { catchAsync } from "../../../utils/error/errorHandler.js";
import { parsePagination } from "../../../utils/others/pagination.js";
import AppError from "../../../utils/error/appError.js";

export const createShipment = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;

  const ctx = {
    fareSnapshot:  req.fareSnapshot,
    vehicleType:   req.vehicleType,
    walletId:      req.walletId,
    totalCharge:   req.totalCharge,
    overageCharge: req.overageCharge,
    distanceKm:    req.distanceKm,
    deliveryLat:   req.deliveryLat,
    deliveryLng:   req.deliveryLng,
    subscription:  req.subscription,
  };

  const shipment = await shipmentService.createShipment(merchantId, req.body, req.userId, ctx);
  return res.status(201).json({ success: true, data: shipment });
});
export const getFarePreview = catchAsync(async (req, res) => {
  // computeFare middleware already ran — just return the values
  return res.json({
    success: true,
    data: {
      distanceKm:    parseFloat(req.distanceKm.toFixed(2)),
      fareSnapshot:  req.fareSnapshot,
      overageCharge: req.overageCharge ?? 0,
      totalCharge:   req.fareSnapshot + (req.overageCharge ?? 0),
      vehicleType:   req.vehicleType.name,
    },
  });
});
export const getMyShipments = catchAsync(async (req, res) => {
  const merchantId            = req.merchantProfileId;
  const { page, limit, skip } = parsePagination(req.query);
  const { status }            = req.query;
  const result                = await shipmentService.getMerchantShipments(merchantId, { page, limit, skip, status });
  return res.json(result);
});

export const getShipmentById = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;
  const shipment   = await shipmentService.getShipmentDetail(req.params.id, merchantId);
  return res.json(shipment);
});

export const cancelShipment = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;
  const shipment   = await shipmentService.cancelShipment(req.params.id, merchantId, req.userId);
  return res.json(shipment);
});

export const getCODLedger = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;
  const result     = await shipmentService.getMerchantCODLedger(merchantId);
  return res.json(result);
});

export const bulkCreateShipments = catchAsync(async (req, res) => {
  if (!req.file) throw AppError(400, 'No file uploaded.');
  const result = await shipmentService.bulkCreateShipments(
    req.merchantProfileId,
    req.file,
    req.userId
  );
  return res.status(201).json(result);
});