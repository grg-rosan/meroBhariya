import { Router }           from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import * as riderController from "./rider.controller.js";
import * as riderDocument   from "./documents/riderDocument.controller.js";
import * as riderFinance    from "./finance/riderFinance.controller.js";
import * as riderCOD        from "./cod/riderCOD.controller.js";
import { uploadRiderDocs }  from "../../config/multer.config.js"; 

const router = Router();
router.use(requireAuth, requireRole("RIDER"));

// ─── Core ops ─────────────────────────────────────────────────
router.get  ("/dashboard", riderController.getDashboard);
router.patch("/duty",      riderController.toggleDuty);
router.get  ("/manifest",  riderController.getManifest);
router.post ("/deliver",   riderController.deliverPackage);
router.patch("/location",  riderController.updateLocation);

// ─── Finance ──────────────────────────────────────────────────
router.get  ("/earnings",  riderFinance.getEarnings);
router.get  ("/wallet",    riderFinance.getWallet);
router.post ("/payouts",   riderFinance.requestPayout);
router.get  ("/payouts",   riderFinance.getPayouts);

// ─── COD ──────────────────────────────────────────────────────
router.get  ("/cod",       riderCOD.getCODSummary);
router.post ("/cod/remit", riderCOD.remitCOD);

// ─── Documents ────────────────────────────────────────────────
router.get  ("/documents", riderDocument.getDocuments);
router.post ("/documents", uploadRiderDocs, riderDocument.uploadDocuments); 
export default router;