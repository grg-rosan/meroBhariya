// src/modules/dispatcher/dispatcher.routes.js
import { Router }      from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import {
  getPendingShipments,
  getHubInventory,          // ← add
  getAvailableRiders,
  assignRider,
  scanHandoff,
  scanHandoffByTracking,    // ← add
  updateStatus,
} from "./dispatcher.controller.js";

const router = Router();

router.use(requireAuth, requireRole("DISPATCHER"));


router.get ("/shipments/hub",                   getHubInventory);        
router.get ("/shipments",                        getPendingShipments);
router.get ("/riders/available",                 getAvailableRiders);
router.patch("/shipments/:id/assign",            assignRider);
router.post ("/shipments/:trackingNumber/scan",  scanHandoffByTracking); 
router.patch("/shipments/:id/status",            updateStatus);

export default router;