// src/modules/dispatcher/dispatcher.routes.js
import { Router }      from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import {
  getPendingShipments,
  getAvailableRiders,
  assignRider,
  scanHandoff,
  updateStatus,
  getStuckShipments
} from "./dispatcher.controller.js";

const router = Router();

router.use(requireAuth, requireRole("DISPATCHER"));

router.get ("/shipments",              getPendingShipments);  // board view
router.get ("/shipments/stuck",         getStuckShipments);
router.get ("/riders/available",       getAvailableRiders);   // rider picker
router.patch("/shipments/:id/assign",  assignRider);          // assign rider
router.post ("/shipments/:id/scan",    scanHandoff);          // two-man hub scan
router.patch("/shipments/:id/status",  updateStatus);         // IN_HUB → OUT_FOR_DELIVERY

export default router;