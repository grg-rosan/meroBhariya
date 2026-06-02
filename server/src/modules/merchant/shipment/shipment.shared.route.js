//shipment.shared.route.js
import { Router }          from "express";
import { requireAuth, requireRole } from "../../auth/auth.middleware.js";
import { geofenceCheck } from "../../../middlewares/geofence.middleware.js";
import { deliverShipment, riderScanShipment } from "./shipment.controller.js";
const router = Router();
router.post(
  "/:trackingNumber/scan",
  requireAuth,
  requireRole("RIDER"),
  riderScanShipment,
);
router.post(
  "/:id/deliver",
  requireAuth,
  requireRole("RIDER"),
  geofenceCheck,         
  deliverShipment,
);

export default router;