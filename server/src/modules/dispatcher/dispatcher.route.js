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
  getPickupQueue,
  assignRiderForPickup
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

// Add these two routes (before any :id param routes):
router.get("/shipments/pickup-queue",              getPickupQueue);

// Rider routes
router.get("/riders/available", getAvailableRiders);  // optional ?vehicleTypeId=
router.get("/riders/nearest",   getNearestRiders);     // required ?lat=&lng=, optional &vehicleTypeId=

router.patch("/shipments/:id/assign-pickup-rider", assignRiderForPickup);

export default router;