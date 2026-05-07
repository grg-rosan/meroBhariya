// src/modules/merchant/merchant.middleware.js
// Runs after requireAuth — resolves the MerchantProfile from req.userId
// and attaches req.merchantProfileId so services never do this lookup themselves.

import { prisma } from "../../config/db.config.js";
import AppError   from "../../utils/error/appError.js";
import { getDistanceKm, calculateFare } from "./shipment/shipment.helpers.js";


export async function requireMerchantProfile(req, res, next) {
  try {
    const profile = await prisma.merchantProfile.findUnique({
      where: { userId: req.userId },
    });

    if (!profile) {
      return next(new AppError("Merchant profile not found.",403 ));
    }

    req.merchantProfileId = profile.id;
    next();
  } catch (err) {
    next(err);
  }
}

// Runs after requireMerchantProfile — blocks access until all docs are approved.
// Use on routes that require a verified merchant e.g. creating shipments.

export async function requireVerifiedMerchant(req, res, next) {
  try {
    const profile = await prisma.merchantProfile.findUnique({
      where: { userId: req.userId },
      select: { isVerified: true },
    });

    if (!profile?.isVerified) {
      return next(new AppError("Your merchant account is pending verification.",403));
    }

    next();
  } catch (err) {
    next(err);
  }
}

// ── checkSubscription ─────────────────────────────────────────
export async function checkSubscription(req, res, next) {
  try {
    const subscription = await prisma.merchantSubscription.findUnique({
      where:   { merchantId: req.merchantProfileId },
      include: { plan: true },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      return next(new AppError("No active subscription. Please subscribe to a plan.", 403));
    }

    if (new Date() > new Date(subscription.currentPeriodEnd)) {
      await prisma.merchantSubscription.update({
        where: { merchantId: req.merchantProfileId },
        data:  { status: "EXPIRED" },
      });
      return next(new AppError("Your subscription has expired. Please renew.", 403));
    }

    const { plan, shipmentsUsed } = subscription;
    const withinQuota = plan.shipmentQuota === null || shipmentsUsed < plan.shipmentQuota;

    if (!withinQuota) {
      if (!plan.overageRate) {
        return next(
          new AppError(
            `Monthly quota of ${plan.shipmentQuota} shipments reached. Please upgrade your plan.`,
            402
          )
        );
      }
      req.overageCharge = Number(plan.overageRate);
    } else {
      req.overageCharge = 0;
    }

    req.subscription = subscription;
    next();
  } catch (err) {
    next(err);
  }
}

// ── computeFare ───────────────────────────────────────────────
// Validates vehicle, calculates distance via PostGIS,
// computes fare and attaches to req.

export async function computeFare(req, res, next) {
  try {
    const {
      vehicleTypeId,
      weight,
      isFragile,
      codAmount,
      paymentType,
      deliveryLat,
      deliveryLng,
    } = req.body;

    // Validate required fields
    if (!vehicleTypeId) {
      return next(new AppError("vehicleTypeId is required.", 400));
    }
    if (!deliveryLat || !deliveryLng) {
      return next(new AppError("deliveryLat and deliveryLng are required.", 400));
    }

    // Validate coordinate ranges (Nepal bounding box)
    const lat = parseFloat(deliveryLat);
    const lng = parseFloat(deliveryLng);
    if (lat < 26.3 || lat > 30.5 || lng < 80.0 || lng > 88.2) {
      return next(new AppError("Delivery coordinates appear to be outside Nepal.", 400));
    }

    // Fetch vehicle type + fare config
    const vehicleType = await prisma.vehicleType.findFirst({
      where:   { id: Number(vehicleTypeId), isActive: true },
      include: { fareConfig: true },
    });

    if (!vehicleType) {
      return next(new AppError("Vehicle type not found or inactive.", 404));
    }
    if (!vehicleType.fareConfig) {
      return next(new AppError(`No fare config set for vehicle type: ${vehicleType.name}`, 400));
    }
    if (Number(weight) > vehicleType.maxWeightKg) {
      return next(
        new AppError(
          `Package weight ${weight}kg exceeds max ${vehicleType.maxWeightKg}kg for ${vehicleType.name}.`,
          400
        )
      );
    }

    // Check merchant has location set
    const merchantProfile = await prisma.merchantProfile.findUnique({
      where:  { id: req.merchantProfileId },
      select: { location: true },
    });

    if (!merchantProfile?.location) {
      return next(
        new AppError("Merchant pickup location is not set. Please update your profile.", 400)
      );
    }

    // Calculate distance via PostGIS
    const distanceKm = await getDistanceKm(req.merchantProfileId, lat, lng);

    // Calculate fare
    const fareSnapshot = calculateFare(
      vehicleType.fareConfig,
      distanceKm,
      {
        weight:    Number(weight),
        isFragile: isFragile ?? false,
        codAmount: Number(codAmount ?? 0),
        paymentType,
      }
    );

    // Attach to req for downstream middleware + service
    req.fareSnapshot = fareSnapshot;
    req.distanceKm   = distanceKm;
    req.vehicleType  = vehicleType;
    req.deliveryLat  = lat;
    req.deliveryLng  = lng;

    next();
  } catch (err) {
    next(err);
  }
}

// ── checkWalletBalance ────────────────────────────────────────
// Ensures wallet covers fare + overage charge.
// Must run AFTER computeFare and checkSubscription.

export async function checkWalletBalance(req, res, next) {
  try {
    const wallet = await prisma.merchantWallet.findUnique({
      where: { merchantId: req.merchantProfileId },
    });

    if (!wallet) {
      return next(new AppError("Merchant wallet not found. Please contact support.", 404));
    }

    const totalRequired = Number(req.fareSnapshot) + Number(req.overageCharge ?? 0);
    const balance       = Number(wallet.balance);

    if (balance < totalRequired) {
      return next(
        new AppError(
          `Insufficient wallet balance. Required: NPR ${totalRequired.toFixed(2)}, Available: NPR ${balance.toFixed(2)}. Please top up your wallet.`,
          402
        )
      );
    }

    req.walletId    = wallet.id;
    req.totalCharge = totalRequired;
    next();
  } catch (err) {
    next(err);
  }
}