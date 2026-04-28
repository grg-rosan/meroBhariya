// src/modules/merchant/document/merchant.document.controller.js
import { prisma } from "../../../config/db.config.js";
import * as docService from "./merchant.doc.service.js";

function handleError(res, err) {
  if (err.status && err.message)
    return res.status(err.status).json({ message: err.message });
  console.error("[Merchant/Documents]", err);
  return res.status(500).json({ message: "Internal server error." });
}

// Shared helper — resolves merchantProfile.id from req.userId
async function getMerchantProfile(userId) {
  const profile = await prisma.merchantProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw { status: 404, message: "Merchant profile not found." };
  return profile;
}

// ─── POST /api/merchant/documents ────────────────────────────────────────────
// Multipart form — field name must match MerchantDocType enum value
// e.g. field "PAN_CERTIFICATE", "OWNER_CITIZENSHIP", etc.

export async function uploadDocumentsHandler(req, res) {
  try {
    const profile = await getMerchantProfile(req.userId);

    // req.files from multer.fields() → { FIELD_NAME: [FileObject], ... }
    // Flatten arrays to single file per type
    const files = {};
    for (const [type, fileArr] of Object.entries(req.files ?? {})) {
      files[type] = Array.isArray(fileArr) ? fileArr[0] : fileArr;
    }

    const docs = await docService.uploadMerchantDocuments({
      merchantId: profile.id,
      files,
    });

    return res.status(201).json({ success: true, data: docs });
  } catch (err) {
    return handleError(res, err);
  }
}

// ─── GET /api/merchant/documents ─────────────────────────────────────────────

export async function getDocumentsHandler(req, res) {
  try {
    const profile = await getMerchantProfile(req.userId);
    const docs    = await docService.getMerchantDocuments(profile.id);
    return res.json({ success: true, data: docs });
  } catch (err) {
    return handleError(res, err);
  }
}

// ─── GET /api/merchant/documents/status ──────────────────────────────────────

export async function getDocumentStatusHandler(req, res) {
  try {
    const profile = await getMerchantProfile(req.userId);
    const status  = await docService.getMerchantDocumentStatus(profile.id);
    return res.json({ success: true, data: status });
  } catch (err) {
    return handleError(res, err);
  }
}