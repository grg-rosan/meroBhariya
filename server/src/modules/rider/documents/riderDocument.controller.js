import { catchAsync } from "../../../utils/error/errorHandler.js";
import AppError from "../../../utils/error/appError.js";
import * as docService from "./riderDocument.services.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../../utils/services/cloudinary.js";
import logger from "../../../infrastructure/logger/index.js";
export const getDocuments = catchAsync(async (req, res) => {
  const data = await docService.getRiderDocuments(req.userId);
  res.status(200).json({ success: true, data });
});

export const uploadDocuments = catchAsync(async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    throw new AppError("No files provided.", 400);
  }

  const uploads = [];

  for (const [type, fileArr] of Object.entries(req.files)) {
    const file = Array.isArray(fileArr) ? fileArr[0] : fileArr;

    // Handle replacement: Delete old asset if exists
    const existing = await docService.getRiderDocumentByType(req.userId, type);
    if (existing?.filePublicId) {
      await deleteFromCloudinary(existing.filePublicId).catch((err) =>
        logger.warn({ err }, "[RiderDocs] Failed to delete old asset"),
      );
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      file.path,
      `porter/rider/${req.userId}/documents`,
    );

    // Save to DB
    const doc = await docService.upsertRiderDocument(req.userId, {
      type,
      fileUrl: result.secure_url,
      filePublicId: result.public_id,
      expiresAt: req.body.expiresAt ?? null,
    });

    uploads.push(doc);
  }

  res.status(201).json({ success: true, data: uploads });
});
