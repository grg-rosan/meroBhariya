// src/modules/merchant/shipment/shipment.routes.js
import { Router } from "express";
import { requireAuth }            from "../../auth/auth.middleware.js";
import { requireMerchantProfile } from "../merchant.middleware.js";
import {
  createShipment,
  getMyShipments,
  getShipmentById,
  cancelShipment,
} from "./shipment.controller.js";

const router = Router();

// All routes: must be logged in + have a merchant profile
router.use(requireAuth, requireMerchantProfile);

router.post("/",        createShipment);   // POST   /api/merchant/shipments
router.get( "/",        getMyShipments);   // GET    /api/merchant/shipments
router.get( "/:id",     getShipmentById);  // GET    /api/merchant/shipments/:id
router.delete("/:id",   cancelShipment);   // DELETE /api/merchant/shipments/:id

export default router;