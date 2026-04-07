// src/modules/merchant/merchant.middleware.js
// Runs after requireAuth — resolves the MerchantProfile from req.userId
// and attaches req.merchantProfileId so services never do this lookup themselves.

import { prisma }   from "../../config/prisma.js";
import { appError } from "../../utils/errorHandler.js";

export async function requireMerchantProfile(req, res, next) {
  try {
    const profile = await prisma.merchantProfile.findUnique({
      where: { userId: req.userId },
    });

    if (!profile) {
      return next(appError(403, "Merchant profile not found."));
    }

    req.merchantProfileId = profile.id;
    next();
  } catch (err) {
    next(err);
  }
}