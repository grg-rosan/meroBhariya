// src/modules/dispatcher/dispatcher.controller.js
import * as dispatcherService from "./dispatcher.services.js";
import { catchAsync }         from "../../utils/error/errorHandler.js";
import { parsePagination }    from "../../utils/others/pagination.js";

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

// ── ADD to dispatcher.controller.js ──────────────────────────────────────────

// GET /api/dispatcher/shipments/hub
export const getHubInventory = catchAsync(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const result = await dispatcherService.getHubInventory({ page, limit, skip });
  return res.json({ success: true, data: result });
});

// POST /api/dispatcher/shipments/:trackingNumber/scan
// Override existing scanHandoff to accept trackingNumber instead of ID
export const scanHandoffByTracking = catchAsync(async (req, res) => {
  const result = await dispatcherService.scanHandoffByTracking(
    req.params.trackingNumber,
    req.userId
  );
  return res.json(result);
});


// ── ADD to dispatcher.route.js ────────────────────────────────────────────────
// IMPORTANT: /shipments/hub must be registered BEFORE /shipments/:id
// otherwise Express matches "hub" as the :id param

// router.get ("/shipments/hub",                    dispatcherCtrl.getHubInventory);
// router.get ("/shipments",                        dispatcherCtrl.getPendingShipments);
// router.get ("/riders/available",                 dispatcherCtrl.getAvailableRiders);
// router.patch("/shipments/:id/assign",            dispatcherCtrl.assignRider);
// router.post ("/shipments/:trackingNumber/scan",  dispatcherCtrl.scanHandoffByTracking);
// router.patch("/shipments/:id/status",            dispatcherCtrl.updateStatus);