// src/modules/merchant/merchant.controller.js
import { prisma }     from "../../config/db.config.js";
import { catchAsync } from "../../utils/error/errorHandler.js";
import AppError       from "../../utils/error/appError.js";

// GET /api/merchant/me
export const getMyProfile = catchAsync(async (req, res) => {
  const profile = await prisma.merchantProfile.findUnique({
    where:  { userId: req.userId },
    select: {
      id:            true,
      businessName:  true,
      pickupAddress: true,
      isVerified:    true,
    },
  });

  if (!profile) throw new AppError("Merchant profile not found.", 404);

  return res.json({ success: true, data: profile });
});