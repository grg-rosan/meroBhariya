import * as dispatcherService from "./dispatcher.services.js";
import { catchAsync }         from "../../utils/error/errorHandler.js";
import { parsePagination }    from "../../utils/others/pagination.js";

export const getPendingShipments = catchAsync(async (req, res) => {
  
  const { page, limit, skip } = parsePagination(req.query);
  const result = await dispatcherService.getPendingShipments({ page, limit, skip });
  res.json(result);
});

export const getHubInventory = catchAsync(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const result = await dispatcherService.getHubInventory({ page, limit, skip });
  res.json({ success: true, data: result });
});

export const getStuckPackages = catchAsync(async (req, res) => {
  const result = await dispatcherService.getStuckPackages();
  res.json({ success: true, data: result });
});

export const getAvailableRiders = catchAsync(async (req, res) => {
  const { vehicleTypeId } = req.query;
  const riders = await dispatcherService.getAvailableRiders(vehicleTypeId ?? null);
  res.json(riders);
});

export const getNearestRiders = catchAsync(async (req, res) => {
  const { lat, lng, vehicleTypeId, limit } = req.query;
  if (!lat || !lng) return res.status(400).json({ message: "lat and lng are required." });
  const riders = await dispatcherService.getNearestRiders({
    lat:           parseFloat(lat),
    lng:           parseFloat(lng),
    vehicleTypeId: vehicleTypeId ?? null,
    limit:         limit ? parseInt(limit) : 10,
  });
  res.json(riders);
});

export const assignRider = catchAsync(async (req, res) => {
  const { id }      = req.params;
  const { riderId } = req.body;
  if (!riderId) return res.status(400).json({ message: "riderId is required." });
  const shipment = await dispatcherService.assignRider(id, riderId, req.userId);
  res.json(shipment);
});

export const scanToHub = catchAsync(async (req, res) => {
  const result = await dispatcherService.scanToHub(
    req.params.trackingNumber,
    req.userId
  );
  res.json({ success: true, data: result });
});

export const updateStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: "status is required." });
  const shipment = await dispatcherService.updateShipmentStatus(req.params.id, status, req.userId);
  res.json(shipment);
});