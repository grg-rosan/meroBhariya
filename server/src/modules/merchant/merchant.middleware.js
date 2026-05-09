// merchant/merchant.middleware.js

import { prisma }           from "../../config/db.config.js";
import AppError             from "../../utils/error/appError.js";
import { getDistanceKm }    from "./shipment/shipment.helpers.js";
import { resolveZone }      from "../zone/zone.service.js";
import { computeFare }      from "../../utils/fare/computeFare.js";

// ── requireMerchantProfile ────────────────────────────────────
// Runs after requireAuth
// Attaches req.merchantProfileId

export async function requireMerchantProfile(req, res, next) {
  try {
    const profile = await prisma.merchantProfile.findUnique({
      where: { userId: req.userId },
    });
    if (!profile) return next(new AppError("Merchant profile not found.", 403));

    req.merchantProfileId = profile.id;
    next();
  } catch (err) {
    next(err);
  }
}

// ── requireVerifiedMerchant ───────────────────────────────────
// Blocks unverified merchants from creating shipments

export async function requireVerifiedMerchant(req, res, next) {
  try {
    const profile = await prisma.merchantProfile.findUnique({
      where:  { userId: req.userId },
      select: { isVerified: true },
    });
    if (!profile?.isVerified) {
      return next(new AppError("Your merchant account is pending verification.", 403));
    }
    next();
  } catch (err) {
    next(err);
  }
}

// ── computeFareMw ─────────────────────────────────────────────
// Validates vehicle + coordinates + districts
// Computes distance via PostGIS
// Resolves zone from districts
// Computes full fare breakdown
// Attaches everything to req for controller + service

export async function computeFareMw(req, res, next) {
  try {
    const {
      vehicleTypeId,
      weight,
      isFragile,
      orderValue,
      codAmount,
      paymentType,
      deliveryLat,
      deliveryLng,
      fromDistrictId,
      toDistrictId,
    } = req.body;

    // ── Validate required fields
    if (!vehicleTypeId)               return next(new AppError("vehicleTypeId is required.", 400));
    if (!deliveryLat || !deliveryLng) return next(new AppError("deliveryLat and deliveryLng are required.", 400));
    if (!fromDistrictId)              return next(new AppError("fromDistrictId is required.", 400));
    if (!toDistrictId)                return next(new AppError("toDistrictId is required.", 400));
    if (!orderValue)                  return next(new AppError("orderValue is required.", 400));

    // ── Validate Nepal bounding box
    const lat = parseFloat(deliveryLat);
    const lng = parseFloat(deliveryLng);
    if (lat < 26.3 || lat > 30.5 || lng < 80.0 || lng > 88.2) {
      return next(new AppError("Delivery coordinates appear to be outside Nepal.", 400));
    }

    // ── Fetch vehicle type + fare config
    const vehicleType = await prisma.vehicleType.findFirst({
      where:   { id: Number(vehicleTypeId), isActive: true },
      include: { fareConfig: true },
    });
    if (!vehicleType)             return next(new AppError("Vehicle type not found or inactive.", 404));
    if (!vehicleType.fareConfig)  return next(new AppError(`No fare config for: ${vehicleType.name}`, 400));
    if (Number(weight) > vehicleType.maxWeightKg) {
      return next(new AppError(
        `Weight ${weight}kg exceeds max ${vehicleType.maxWeightKg}kg for ${vehicleType.name}.`, 400
      ));
    }

    // ── Check merchant has location set
    const merchantProfile = await prisma.merchantProfile.findUnique({
      where:  { id: req.merchantProfileId },
      select: { location: true },
    });
    if (!merchantProfile?.location) {
      return next(new AppError("Merchant pickup location not set. Please update your profile.", 400));
    }

    // ── Resolve zone from districts
    const { fromDistrict, toDistrict, zone } = await resolveZone(
      Number(fromDistrictId),
      Number(toDistrictId),
    );

    // ── Calculate distance via PostGIS
    const distanceKm = await getDistanceKm(req.merchantProfileId, lat, lng);

    // ── Compute full fare breakdown
    const fare = computeFare(
      vehicleType.fareConfig,
      distanceKm,
      zone,
      {
        weight:     Number(weight),
        isFragile:  isFragile ?? false,
        orderValue: Number(orderValue),
        codAmount:  Number(codAmount ?? 0),
        paymentType,
      }
    );

    // ── Attach to req
    req.vehicleType   = vehicleType;
    req.distanceKm    = distanceKm;
    req.deliveryLat   = lat;
    req.deliveryLng   = lng;
    req.fare          = fare;
    req.zone          = zone;
    req.fromDistrict  = fromDistrict;
    req.toDistrict    = toDistrict;

    next();
  } catch (err) {
    next(err);
  }
}