import * as shipmentService from "./shipment/dispatcher.shipment.service.js";
import * as riderService    from "./riders/dispatcher.rider.service.js";
import { catchAsync }       from "../../utils/error/errorHandler.js";
import { parsePagination }  from "../../utils/others/pagination.js";

export const getPendingShipments = catchAsync(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const result = await shipmentService.getPendingShipments({ page, limit, skip });
  res.json(result);
});

export const getHubInventory = catchAsync(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const result = await shipmentService.getHubInventory({ page, limit, skip });
  res.json({ success: true, data: result });
});

export const getStuckPackages = catchAsync(async (req, res) => {
  const result = await shipmentService.getStuckPackages();
  res.json({ success: true, data: result });
});

export const getAvailableRiders = catchAsync(async (req, res) => {
  const riders = await riderService.getAvailableRiders(req.query.vehicleTypeId ?? null);
  res.json(riders);
});

export const getNearestRiders = catchAsync(async (req, res) => {
  const { lat, lng, vehicleTypeId, limit } = req.query;
  if (!lat || !lng) return res.status(400).json({ message: "lat and lng are required." });
  const riders = await riderService.getNearestRiders({
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
  const shipment = await shipmentService.assignRider(id, riderId, req.userId);
  res.json(shipment);
});

export const scanToHub = catchAsync(async (req, res) => {
  const result = await shipmentService.scanToHub(
    req.params.trackingNumber,
    req.userId
  );
  res.json({ success: true, data: result });
});

export const updateStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: "status is required." });
  const shipment = await shipmentService.updateShipmentStatus(req.params.id, status, req.userId);
  res.json(shipment);
});

export const getPickupQueue = catchAsync(async (req, res) => {
  const { zoneId, districtId } = req.query;
  const { page, limit, skip }  = parsePagination(req.query);
  const result = await shipmentService.getPickupQueue({ page, limit, skip, zoneId, districtId });
  res.json({ success: true, ...result });
});

export const assignRiderForPickup = catchAsync(async (req, res) => {
  const { id }             = req.params;
  const { riderProfileId } = req.body;
  if (!riderProfileId) return res.status(400).json({ message: "riderProfileId is required." });
  const result = await shipmentService.assignRiderForPickup(id, riderProfileId, req.userId);
  res.json({ success: true, data: result });
});