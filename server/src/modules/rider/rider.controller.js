import asyncHandler from "../../../utils/asyncHandlers.js";
import { AppError } from "../../../utils/AppError.js";
import * as riderService from "./rider.services.js";

// ─────────────────────────────────────────
// GET /rider/dashboard
// ─────────────────────────────────────────

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await riderService.getShiftSummary(req.user.id);
  res.status(200).json({ success: true, data });
});

// ─────────────────────────────────────────
// PATCH /rider/duty
// ─────────────────────────────────────────

export const toggleDuty = asyncHandler(async (req, res) => {
  const data = await riderService.toggleDutyStatus(req.user.id);
  res.status(200).json({ success: true, data });
});

// ─────────────────────────────────────────
// GET /rider/manifest
// ─────────────────────────────────────────

export const getManifest = asyncHandler(async (req, res) => {
  const data = await riderService.getRiderManifest(req.user.id);
  res.status(200).json({ success: true, data });
});

// ─────────────────────────────────────────
// POST /rider/deliver
// Body: { trackingNumber, codCollected?, note? }
// ─────────────────────────────────────────

export const deliverPackage = asyncHandler(async (req, res) => {
  const { trackingNumber, codCollected, note } = req.body;

  if (!trackingNumber) throw new AppError("trackingNumber is required", 400);

  const data = await riderService.deliverPackage(req.user.id, trackingNumber, {
    codCollected,
    note,
  });

  res.status(200).json({ success: true, data });
});

// ─────────────────────────────────────────
// PATCH /rider/location
// Body: { latitude, longitude }
// ─────────────────────────────────────────

export const updateLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;

  if (latitude == null || longitude == null) {
    throw new AppError("latitude and longitude are required", 400);
  }

  const data = await riderService.updateRiderLocation(req.user.id, { latitude, longitude });
  res.status(200).json({ success: true, data });
});

// ─────────────────────────────────────────
// GET /rider/earnings
// Query: ?page&limit&from=ISO&to=ISO
// ─────────────────────────────────────────

export const getEarnings = asyncHandler(async (req, res) => {
  const data = await riderService.getRiderEarnings(req.user.id, req.query);
  res.status(200).json({ success: true, ...data });
});

// ─────────────────────────────────────────
// GET /rider/documents
// ─────────────────────────────────────────

export const getDocuments = asyncHandler(async (req, res) => {
  const data = await riderService.getRiderDocuments(req.user.id);
  res.status(200).json({ success: true, data });
});

// ─────────────────────────────────────────
// POST /rider/documents
// Multipart — fileUrl + filePublicId attached by cloudinary middleware
// ─────────────────────────────────────────

export const uploadDocument = asyncHandler(async (req, res) => {
  const { type, expiresAt } = req.body;
  const { fileUrl, filePublicId } = req.uploadedFile ?? {};

  if (!type) throw new AppError("type is required", 400);
  if (!fileUrl) throw new AppError("File upload failed — no URL returned", 400);

  const data = await riderService.upsertRiderDocument(req.user.id, {
    type,
    fileUrl,
    filePublicId,
    expiresAt,
  });

  res.status(201).json({ success: true, data });
});