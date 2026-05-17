// src/modules/merchant/document/merchant.document.service.js
import { prisma } from "../../../config/db.config.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../../utils/services/cloudinary.js";
import logger from "../../../infrastructure/logger/index.js";
// ─── Required doc types (matches MerchantDocType enum in schema) ──────────────

export const REQUIRED_DOC_TYPES = [
  "PAN_CERTIFICATE",
  "BUSINESS_REGISTRATION",
  "TAX_CLEARANCE",
  "OWNER_CITIZENSHIP",
  "OWNER_PHOTO",
];

// ─── Upload / replace merchant documents ─────────────────────────────────────
// files: { PAN_CERTIFICATE: multerFile, BUSINESS_REGISTRATION: multerFile, ... }
// Each existing doc for the same type is deleted from Cloudinary then replaced in DB.

export async function uploadMerchantDocuments({ merchantId, files }) {
  if (!files || Object.keys(files).length === 0) {
    throw { status: 400, message: "No files provided." };
  }

  const invalidTypes = Object.keys(files).filter(
    (t) => !REQUIRED_DOC_TYPES.includes(t),
  );
  if (invalidTypes.length) {
    throw {
      status: 400,
      message: `Invalid document type(s): ${invalidTypes.join(", ")}. Allowed: ${REQUIRED_DOC_TYPES.join(", ")}`,
    };
  }

  const results = [];

  for (const [type, file] of Object.entries(files)) {
    // Check if doc already exists for this type — delete old Cloudinary asset first
    const existing = await prisma.merchantDocument.findFirst({
      where: { merchantId, type },
    });

    if (existing?.filePublicId) {
      await deleteFromCloudinary(existing.filePublicId).catch((err) =>
        logger.warn(
          { err },
          "[MerchantDocs] Failed to delete old Cloudinary asset",
        ),
      );
    }

    // Upload new file to Cloudinary
    const { url: fileUrl, public_id: filePublicId } = await uploadToCloudinary(
      file.path,
      { folder: `porter/merchant/${merchantId}/documents` },
    );

    if (existing) {
      // Replace existing doc — reset status to PENDING, clear rejection note
      const updated = await prisma.merchantDocument.update({
        where: { id: existing.id },
        data: {
          fileUrl,
          filePublicId,
          status: "PENDING",
          note: null,
          uploadedAt: new Date(),
          reviewedAt: null,
        },
      });
      results.push(updated);
    } else {
      // Create new doc
      const created = await prisma.merchantDocument.create({
        data: {
          merchantId,
          type,
          fileUrl,
          filePublicId,
          status: "PENDING",
          uploadedAt: new Date(),
        },
      });
      results.push(created);
    }
  }

  return results;
}

// ─── Get all documents for a merchant ────────────────────────────────────────

export async function getMerchantDocuments(merchantId) {
  return prisma.merchantDocument.findMany({
    where: { merchantId },
    orderBy: { uploadedAt: "desc" },
  });
}

// ─── Get document status summary ─────────────────────────────────────────────

export async function getMerchantDocumentStatus(merchantId) {
  const docs = await prisma.merchantDocument.findMany({
    where: { merchantId },
    select: {
      id: true,
      type: true,
      status: true,
      note: true,
      fileUrl: true,
      uploadedAt: true,
      reviewedAt: true,
    },
  });

  const uploadedTypes = docs.map((d) => d.type);
  const missing = REQUIRED_DOC_TYPES.filter((t) => !uploadedTypes.includes(t));
  const allSubmitted = missing.length === 0;
  const allApproved =
    allSubmitted && docs.every((d) => d.status === "APPROVED");
  const hasRejected = docs.some((d) => d.status === "REJECTED");

  return {
    documents: docs,
    allSubmitted,
    allApproved,
    hasRejected,
    missing,
  };
}
