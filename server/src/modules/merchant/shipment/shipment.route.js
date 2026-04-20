import { Router } from "express";
import { requireAuth } from "../../auth/auth.middleware.js";
import { requireMerchantProfile } from "../merchant.middleware.js";
import {
  createShipment,
  getMyShipments,
  getShipmentById,
  cancelShipment,
  getCODLedger,
} from "./shipment.controller.js";

const router = Router();

router.use(requireAuth, requireMerchantProfile);

router.post("/",             createShipment);
router.get("/",              getMyShipments);
router.get("/cod-ledger",    getCODLedger);
router.get("/:id",           getShipmentById);
router.delete("/:id",        cancelShipment);

export default router;
