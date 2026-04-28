// src/modules/merchant/merchant.middleware.js
// Runs after requireAuth — resolves the MerchantProfile from req.userId
// and attaches req.merchantProfileId so services never do this lookup themselves.

import { prisma } from "../../config/db.config.js";
import AppError   from "../../utils/error/appError.js";

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
      return next(new AppError(403, "Your merchant account is pending verification."));
    }

    next();
  } catch (err) {
    next(err);
  }
}