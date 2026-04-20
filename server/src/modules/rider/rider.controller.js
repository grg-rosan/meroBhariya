import { catchAsync } from "../../utils/error/errorHandler.js";
import AppError from "../../utils/error/appError.js";
import * as riderService from "./rider.services.js";
import { uploadToCloudinary } from "../../utils/services/cloudinary.js";
// ─────────────────────────────────────────
// GET /rider/dashboard
// ─────────────────────────────────────────

export const getDashboard = catchAsync(async (req, res) => {
  const data = await riderService.getShiftSummary(req.user.id);
  res.status(200).json({ success: true, data });
});

// ─────────────────────────────────────────
// PATCH /rider/duty
// ─────────────────────────────────────────

export const toggleDuty = catchAsync(async (req, res) => {
  const data = await riderService.toggleDutyStatus(req.user.id);
  res.status(200).json({ success: true, data });
});

// ─────────────────────────────────────────
// GET /rider/manifest
// ─────────────────────────────────────────

export const getManifest = catchAsync(async (req, res) => {
  const data = await riderService.getRiderManifest(req.user.id);
  res.status(200).json({ success: true, data });
});

// ─────────────────────────────────────────
// POST /rider/deliver
// Body: { trackingNumber, codCollected?, note? }
// ─────────────────────────────────────────

export const deliverPackage = catchAsync(async (req, res) => {
  const { trackingNumber, codCollected, note } = req.body;

  if (!trackingNumber) throw new AppError("trackingNumber is required", 400);

  const data = await riderService.deliverPackage(req.userId, trackingNumber, {
    codCollected,
    note,
  });

  res.status(200).json({ success: true, data });
});

// ─────────────────────────────────────────
// PATCH /rider/location
// Body: { latitude, longitude }
// ─────────────────────────────────────────

export const updateLocation = catchAsync(async (req, res) => {
  const { latitude, longitude } = req.body;

  if (latitude == null || longitude == null) {
    throw new AppError("latitude and longitude are required", 400);
  }

  const data = await riderService.updateRiderLocation(req.userId, { latitude, longitude });
  res.status(200).json({ success: true, data });
});

// ─────────────────────────────────────────
// GET /rider/earnings
// Query: ?page&limit&from=ISO&to=ISO
// ─────────────────────────────────────────

export const getEarnings = catchAsync(async (req, res) => {
  const data = await riderService.getRiderEarnings(req.user.id, req.query);
  res.status(200).json({ success: true, ...data });
});

// ─────────────────────────────────────────
// GET /rider/documents
// ─────────────────────────────────────────

export const getDocuments = catchAsync(async (req, res) => {
  const data = await riderService.getRiderDocuments(req.user.id);
  res.status(200).json({ success: true, data });
});

// ─────────────────────────────────────────
// POST /rider/documents
// Multipart — fileUrl + filePublicId attached by cloudinary middleware
// ─────────────────────────────────────────

export const uploadDocuments = catchAsync(async (req, res) => {
  const uploads = [];
  for (const [type, fileArr] of Object.entries(req.files)) {
    const file   = fileArr[0];
    const result = await uploadToCloudinary(file.path, "porter/rider-docs");
    const doc    = await riderService.upsertRiderDocument(req.user.id, {
      type,
      fileUrl:      result.secure_url,
      filePublicId: result.public_id,
      expiresAt:    req.body.expiresAt ?? null,
    });
    uploads.push(doc);
  }
  res.status(201).json({ status: "success", data: uploads });
});
