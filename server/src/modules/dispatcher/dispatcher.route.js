import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import {
  getPendingShipments,
  getHubInventory,
  getStuckPackages,
  getAvailableRiders,
  getNearestRiders,
  assignRider,
  scanToHub,
  updateStatus,
} from "./dispatcher.controller.js";

const router = Router();
router.use(requireAuth, requireRole("DISPATCHER"));

// Shipment routes — specific paths BEFORE parameterized ones
router.get ("/shipments/hub",                  getHubInventory);
router.get ("/shipments/stuck",                getStuckPackages);
router.get ("/shipments",                       getPendingShipments);
router.patch("/shipments/:id/assign",           assignRider);
router.post ("/shipments/:trackingNumber/scan", scanToHub);   
router.patch("/shipments/:id/status",           updateStatus);

// Rider routes
router.get("/riders/available", getAvailableRiders);  // optional ?vehicleTypeId=
router.get("/riders/nearest",   getNearestRiders);     // required ?lat=&lng=, optional &vehicleTypeId=

export default router;