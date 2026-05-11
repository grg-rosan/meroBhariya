// src/modules/rider/rider.controller.js
import { catchAsync }        from "../../utils/error/errorHandler.js";
import AppError              from "../../utils/error/appError.js";
import * as riderService     from "./rider.services.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/others/services/cloudinary.js";

export const getDashboard = catchAsync(async (req, res) => {
  const data = await riderService.getShiftSummary(req.userId);
  res.status(200).json({ success: true, data });
});


export const toggleDuty = catchAsync(async (req, res) => {
  const { isOnline } = req.body;  // fix typo
  if (typeof isOnline !== "boolean")
    return res.status(400).json({ message: "isOnline (boolean) is required." });
  const data = await riderService.toggleDutyStatus(req.userId, isOnline); // pass value
  res.status(200).json({ success: true, data });
});

export const getManifest = catchAsync(async (req, res) => {
  const data = await riderService.getRiderManifest(req.userId);
  res.status(200).json({ success: true, data });
});


export const deliverPackage = catchAsync(async (req, res) => {
  const { trackingNumber, codCollected, note } = req.body;
  if (!trackingNumber) throw new AppError("trackingNumber is required", 400);

  const data = await riderService.deliverPackage(req.userId, trackingNumber, {
    codCollected,
    note,
  });
  res.status(200).json({ success: true, data });
});

// rider location
export const updateLocation = catchAsync(async (req, res) => {
  const { latitude, longitude } = req.body;
  if (latitude == null || longitude == null) {
    throw new AppError("latitude and longitude are required", 400);
  }
  const data = await riderService.updateRiderLocation(req.userId, { latitude, longitude });
  res.status(200).json({ success: true, data });
});
