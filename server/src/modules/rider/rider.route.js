import { Router }           from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import * as riderController from "./rider.controller.js";
import { uploadRiderDocs }  from "../../config/multer.config.js";

const router = Router();
router.use(requireAuth, requireRole("RIDER"));

router.get  ("/dashboard",  riderController.getDashboard);
router.patch("/duty",       riderController.toggleDuty);
router.get  ("/manifest",   riderController.getManifest);
router.post ("/deliver",    riderController.deliverPackage);
router.patch("/location",   riderController.updateLocation);

// Earnings + wallet
router.get  ("/earnings",   riderController.getEarnings);
router.get  ("/wallet",     riderController.getWallet);

// Payouts
router.post ("/payouts",    riderController.requestPayout);
router.get  ("/payouts",    riderController.getPayouts);

// Documents
router.get  ("/documents",  riderController.getDocuments);
router.post ("/documents",  uploadRiderDocs, riderController.uploadDocuments);

export default router;