import { catchAsync } from "../../utils/error/errorHandler.js";
import {
  createShipmentService,
  listShipmentsService,
  getShipmentService,
  assignRiderService,
  updateStatusService,
  cancelShipmentService,
  handleHandoff,
} from "./shipment.service.js";

export const createShipment = catchAsync(async (req, res) => {
  const shipment = await createShipmentService(req.user.id, req.body);
  res.status(201).json({ status: "success", data: shipment });
});

export const listShipments = catchAsync(async (req, res) => {
  const result = await listShipmentsService(req.user.id, req.user.role, req.query);
  res.status(200).json({ status: "success", data: result });
});

export const getShipment = catchAsync(async (req, res) => {
  const shipment = await getShipmentService(req.params.id, req.user.id, req.user.role);
  res.status(200).json({ status: "success", data: shipment });
});

export const assignRider = catchAsync(async (req, res) => {
  const { riderId } = req.body;
  const shipment = await assignRiderService(req.params.id, riderId, req.user.id);
  res.status(200).json({ status: "success", data: shipment });
});

export const updateStatus = catchAsync(async (req, res) => {
  const { status, note } = req.body;
  const shipment = await updateStatusService(
    req.params.id,
    status.toUpperCase(),
    req.user.id,
    note
  );
  res.status(200).json({ status: "success", data: shipment });
});

export const cancelShipment = catchAsync(async (req, res) => {
  const shipment = await cancelShipmentService(req.params.id, req.user.id, req.user.role);
  res.status(200).json({ status: "success", data: shipment });
});

export const handoff = catchAsync(async (req, res) => {
  const result = await handleHandoff(req.params.id, req.user.id, req.user.role);
  res.status(200).json({ status: "success", data: result });
});