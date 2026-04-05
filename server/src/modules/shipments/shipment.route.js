import express from "express";
import {
  createShipment,
  listShipments,
  getShipment,
  assignRider,
  updateStatus,
  cancelShipment,
  handoff,
} from "./shipment.controller.js";
import { authMiddleware } from "../../infrastructure/middlewares/auth.middleware.js";
import { requireRole } from "../../infrastructure/middlewares/role.middleware.js";

const router = express.Router();

// all routes require auth
router.use(authMiddleware);

router.post(   "/",                requireRole("MERCHANT"),              createShipment);
router.get(    "/",                                                       listShipments);
router.get(    "/:id",                                                    getShipment);
router.patch(  "/:id/assign",      requireRole("ADMIN", "DISPATCHER"),   assignRider);
router.patch(  "/:id/status",      requireRole("ADMIN", "DISPATCHER"),   updateStatus);
router.patch(  "/:id/cancel",      requireRole("MERCHANT", "ADMIN"),     cancelShipment);
router.post(   "/:id/handoff",     requireRole("DISPATCHER", "RIDER"),   handoff);

export default router;