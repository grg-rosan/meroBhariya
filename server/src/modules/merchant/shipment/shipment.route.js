// shipment/shipment.route.js

import { Router } from "express";
import { requireAuth } from "../../auth/auth.middleware.js";
import {
  requireMerchantProfile,
  requireVerifiedMerchant,
  computeFareMw,
} from "../merchant.middleware.js";
import { uploadExcel } from "../../../config/multer.config.js";
import {
  createShipment,
  getFarePreview,
  getDistricts,
  getMyShipments,
  getShipmentById,
  cancelShipment,
  getCODLedger,
  bulkCreateShipments,
} from "./shipment.controller.js";

const router = Router();

router.use(requireAuth, requireMerchantProfile);

// ── Public to verified merchants ──────────────────────────────

// GET  /shipments/districts  ← dropdown for create form
router.get("/districts", getDistricts);

// GET  /shipments/cod-ledger
router.get("/cod-ledger", getCODLedger);

// GET  /shipments
router.get("/", getMyShipments);

// ── Require verified merchant ─────────────────────────────────

// POST /shipments/fare-preview  ← live fare calc before creation
router.post(
  "/fare-preview",
  requireVerifiedMerchant,
  computeFareMw,
  getFarePreview,
);

// POST /shipments/bulk
router.post("/bulk", requireVerifiedMerchant, uploadExcel, bulkCreateShipments);

// POST /shipments
router.post("/", requireVerifiedMerchant, computeFareMw, createShipment);

// ── Param routes last ─────────────────────────────────────────

// GET    /shipments/:id
router.get("/:id", getShipmentById);

// DELETE /shipments/:id
router.delete("/:id", cancelShipment);

export default router;
