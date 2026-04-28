// merchant.document.route.js
import { Router } from "express";
import { requireAuth, requireRole } from "../../auth/auth.middleware.js";
import { uploadMerchantDocs } from "../../../config/multer.config.js";  
import {
  uploadDocumentsHandler,
  getDocumentsHandler,
  getDocumentStatusHandler,
} from "./merchant.doc.controller.js";

const router = Router();

router.get("/status", getDocumentStatusHandler);  
router.get("/",       getDocumentsHandler);
router.post("/",      uploadMerchantDocs, uploadDocumentsHandler);

export default router;