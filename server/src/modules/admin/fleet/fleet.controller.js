// src/modules/admin/fleet/fleet.controller.js
import * as fleetService from "./fleet.services.js";

function handleError(res, err) {
  if (err.status && err.message) return res.status(err.status).json({ message: err.message });
  console.error("[Admin/Fleet]", err);
  return res.status(500).json({ message: "Internal server error." });
}

// GET /api/admin/fleet/vehicle-types
export async function getVehicleTypesHandler(req, res) {
  try {
    return res.json(await fleetService.getAllVehicleTypes());
  } catch (err) { return handleError(res, err); }
}

// POST /api/admin/fleet/vehicle-types
export async function createVehicleTypeHandler(req, res) {
  try {
    const { name, maxWeightKg, description } = req.body;
    if (!name || !maxWeightKg) {
      return res.status(400).json({ message: "name and maxWeightKg are required." });
    }
    const vt = await fleetService.createVehicleType({ name, maxWeightKg, description });
    return res.status(201).json(vt);
  } catch (err) { return handleError(res, err); }
}

// PATCH /api/admin/fleet/vehicle-types/:id/toggle
export async function toggleVehicleTypeHandler(req, res) {
  try {
    const id = parseInt(req.params.id);
    return res.json(await fleetService.toggleVehicleTypeStatus(id));
  } catch (err) { return handleError(res, err); }
}

// GET /api/admin/fleet/fares
export async function getAllFareConfigsHandler(req, res) {
  try {
    return res.json(await fleetService.getAllFareConfigs());
  } catch (err) { return handleError(res, err); }
}

// GET /api/admin/fleet/fares/:vehicleTypeId
export async function getFareConfigHandler(req, res) {
  try {
    const id = parseInt(req.params.vehicleTypeId);
    return res.json(await fleetService.getFareConfig(id));
  } catch (err) { return handleError(res, err); }
}

// PUT /api/admin/fleet/fares/:vehicleTypeId
export async function upsertFareConfigHandler(req, res) {
  try {
    const id = parseInt(req.params.vehicleTypeId);
    const required = ["baseFare", "perKmRate", "perKgRate", "minFare"];
    const missing  = required.filter(k => req.body[k] == null);
    if (missing.length) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
    }
    const config = await fleetService.upsertFareConfig(id, req.body);
    return res.json(config);
  } catch (err) { return handleError(res, err); }
}