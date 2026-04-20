import * as shipmentService from "./shipment.services.js";
import { catchAsync } from "../../../utils/error/errorHandler.js";
import { parsePagination } from "../../../utils/others/pagination.js";

export const createShipment = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;
  const shipment   = await shipmentService.createShipment(merchantId, req.body, req.userId);
  return res.status(201).json(shipment);
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
