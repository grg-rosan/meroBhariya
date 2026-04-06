import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { authorize } from "../../middlewares/role.middlware.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import * as riderController from "./rider.controller.js";

const router = Router();

// All rider routes — must be authenticated and hold the RIDER role
router.use(authenticate, authorize("RIDER"));

// ── Dashboard & Duty ──────────────────────────────────────────────────────────
router.get("/dashboard", riderController.getDashboard);
router.patch("/duty", riderController.toggleDuty);

// ── Manifest ──────────────────────────────────────────────────────────────────
router.get("/manifest", riderController.getManifest);

// ── Delivery confirmation ─────────────────────────────────────────────────────
router.post("/deliver", riderController.deliverPackage);

// ── Live location ─────────────────────────────────────────────────────────────
router.patch("/location", riderController.updateLocation);

// ── Earnings ──────────────────────────────────────────────────────────────────
router.get("/earnings", riderController.getEarnings);

// ── Documents ─────────────────────────────────────────────────────────────────
router.get("/documents", riderController.getDocuments);
router.post("/documents", uploadToCloudinary, riderController.uploadDocument);

export default router;