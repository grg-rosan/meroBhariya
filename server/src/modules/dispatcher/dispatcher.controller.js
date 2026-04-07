// src/modules/dispatcher/dispatcher.controller.js
import * as dispatcherService from "./dispatcher.service.js";
import { catchAsync }         from "../../utils/errorHandler.js";
import { parsePagination }    from "../../utils/pagination.js";

// GET /api/dispatcher/shipments?page=&limit=
export const getPendingShipments = catchAsync(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const result = await dispatcherService.getPendingShipments({ page, limit, skip });
  return res.json(result);
});

// GET /api/dispatcher/riders/available?vehicleTypeId=
export const getAvailableRiders = catchAsync(async (req, res) => {
  const { vehicleTypeId } = req.query;
  if (!vehicleTypeId) return res.status(400).json({ message: "vehicleTypeId is required." });
  const riders = await dispatcherService.getAvailableRiders(vehicleTypeId);
  return res.json(riders);
});

// PATCH /api/dispatcher/shipments/:id/assign
export const assignRider = catchAsync(async (req, res) => {
  const { id }      = req.params;
  const { riderId } = req.body;
  if (!riderId) return res.status(400).json({ message: "riderId is required." });
  const shipment = await dispatcherService.assignRider(id, riderId, req.userId);
  return res.json(shipment);
});

// POST /api/dispatcher/shipments/:id/scan
export const scanHandoff = catchAsync(async (req, res) => {
  const result = await dispatcherService.scanHandoff(req.params.id, req.userId);
  return res.json(result);
});

// PATCH /api/dispatcher/shipments/:id/status
export const updateStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: "status is required." });
  const shipment = await dispatcherService.updateShipmentStatus(req.params.id, status, req.userId);
  return res.json(shipment);
});