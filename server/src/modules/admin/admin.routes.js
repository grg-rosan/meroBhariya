// src/modules/admin/admin.routes.js
import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";

import * as overviewCtrl     from "./overview/overview.controller.js";
import * as verifyCtrl       from "./verify/verify.controller.js";
import * as fleetCtrl        from "./fleet/fleet.controller.js";
import * as financeCtrl      from "./finance/finance.controller.js";
import * as settlementsCtrl  from "./settlements/settlements.controller.js";

const router = Router();

// All admin routes require auth + ADMIN role
router.use(requireAuth, requireRole("ADMIN"));

// ─── Overview ─────────────────────────────────────────────────────────────────
router.get("/overview/stats",         overviewCtrl.getStatsHandler);
router.get("/overview/health",        overviewCtrl.getHealthHandler);
router.get("/overview/quick-actions", overviewCtrl.getQuickActionCountsHandler);
router.get("/overview/activity",      overviewCtrl.getRecentActivityHandler);

// ─── Verify users ─────────────────────────────────────────────────────────────
router.get  ("/verify/merchants",             verifyCtrl.getPendingMerchantsHandler);
router.get  ("/verify/riders",                verifyCtrl.getPendingRidersHandler);
router.get  ("/verify/expired",               verifyCtrl.getExpiredDocsHandler);
router.patch("/verify/merchant-doc/:docId",   verifyCtrl.reviewMerchantDocHandler);
router.patch("/verify/rider-doc/:docId",      verifyCtrl.reviewRiderDocHandler);

// ─── Fleet & fares ────────────────────────────────────────────────────────────
router.get  ("/fleet/vehicle-types",              fleetCtrl.getVehicleTypesHandler);
router.post ("/fleet/vehicle-types",              fleetCtrl.createVehicleTypeHandler);
router.patch("/fleet/vehicle-types/:id/toggle",   fleetCtrl.toggleVehicleTypeHandler);
router.get  ("/fleet/fares",                      fleetCtrl.getAllFareConfigsHandler);
router.get  ("/fleet/fares/:vehicleTypeId",       fleetCtrl.getFareConfigHandler);
router.put  ("/fleet/fares/:vehicleTypeId",       fleetCtrl.upsertFareConfigHandler);

// ─── Finance ──────────────────────────────────────────────────────────────────
router.get  ("/finance/revenue",                        financeCtrl.getRevenueSummaryHandler);
router.get  ("/finance/transactions",                   financeCtrl.getTransactionsHandler);
router.get  ("/finance/cod/pending",                    financeCtrl.getPendingCODHandler);
router.patch("/finance/cod/:transactionId/settle",      financeCtrl.settleCODHandler);
router.post ("/finance/cod/settle-rider/:riderId",      financeCtrl.settleAllCODForRiderHandler);

// ─── Settlements ──────────────────────────────────────────────────────────────
router.get("/settlements/riders",                        settlementsCtrl.getRiderSettlementSummaryHandler);
router.get("/settlements/riders/:riderId",               settlementsCtrl.getRiderSettlementDetailHandler);
router.get("/settlements/shipment/:shipmentId/logs",     settlementsCtrl.getShipmentLogsHandler);

export default router;