// src/modules/merchant/shipment/shipment.controller.js
import * as shipmentService from "./shipment.services.js";
import { catchAsync } from "../../../utils/error/errorHandler.js";
import { parsePagination } from "../../../utils/others/pagination.js";

// POST /api/merchant/shipments
export const createShipment = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId; // set by merchantAuth middleware
  const shipment   = await shipmentService.createShipment(merchantId, req.body,req.userId);
  return res.status(201).json(shipment);
});

// GET /api/merchant/shipments
export const getMyShipments = catchAsync(async (req, res) => {
  const merchantId          = req.merchantProfileId;
  const { page, limit, skip } = parsePagination(req.query);
  const { status }           = req.query;
  const result               = await shipmentService.getMerchantShipments(merchantId, { page, limit, skip, status });
  return res.json(result);
});

// GET /api/merchant/shipments/:id
export const getShipmentById = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;
  const shipment   = await shipmentService.getShipmentDetail(req.params.id, merchantId);
  return res.json(shipment);
});

// DELETE /api/merchant/shipments/:id  (cancel before assignment)
export const cancelShipment = catchAsync(async (req, res) => {
  const merchantId = req.merchantProfileId;
  const shipment   = await shipmentService.cancelShipment(req.params.id, merchantId, req.user.id);
  return res.json(shipment);
});
