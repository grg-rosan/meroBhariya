// src/modules/merchant/merchant.controller.js
import { prisma }     from "../../config/db.config.js";
import { catchAsync } from "../../utils/error/errorHandler.js";
import AppError       from "../../utils/error/appError.js";

// GET /api/merchant/me
export const getMyProfile = catchAsync(async (req, res) => {
  const profile = await prisma.merchantProfile.findUnique({
    where:  { userId: req.userId },
    select: {
      id:               true,
      businessName:     true,
      pickupAddress:    true,
      pickupDistrictId: true,
      isVerified:       true,
      panNumber:        true,
    },
  });

  if (!profile) throw new AppError("Merchant profile not found.", 404);

  const coords = await prisma.$queryRaw`
    SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM "MerchantProfile"
    WHERE id = ${profile.id}
  `;

  if (coords?.length) {
    profile.latitude = coords[0].lat;
    profile.longitude = coords[0].lng;
  } else {
    profile.latitude = null;
    profile.longitude = null;
  }

  return res.json({ success: true, data: profile });
});

// PATCH /api/merchant/me
export const updateMyProfile = catchAsync(async (req, res) => {
  const { businessName, pickupAddress, pickupDistrictId, panNumber, latitude, longitude } = req.body;

  const data = {};
  if (businessName !== undefined) data.businessName = businessName;
  if (pickupAddress !== undefined) data.pickupAddress = pickupAddress;
  if (panNumber !== undefined) data.panNumber = panNumber;
  if (pickupDistrictId !== undefined) {
    if (pickupDistrictId === null) {
      data.pickupDistrictId = null;
    } else {
      const district = await prisma.district.findUnique({
        where: { id: Number(pickupDistrictId) },
      });
      if (!district) throw new AppError("Invalid district selected.", 400);
      data.pickupDistrictId = district.id;
    }
  }

  const profile = await prisma.merchantProfile.update({
    where: { userId: req.userId },
    data,
  });

  if (latitude !== undefined && longitude !== undefined) {
    if (latitude === null || longitude === null) {
      await prisma.$executeRaw`
        UPDATE "MerchantProfile"
        SET "location" = NULL
        WHERE id = ${profile.id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "MerchantProfile"
        SET "location" = ST_SetSRID(ST_MakePoint(${longitude}::float8, ${latitude}::float8), 4326)
        WHERE id = ${profile.id}
      `;
    }
  }

  const coords = await prisma.$queryRaw`
    SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM "MerchantProfile"
    WHERE id = ${profile.id}
  `;

  const updatedProfile = {
    ...profile,
    latitude: coords?.length ? coords[0].lat : null,
    longitude: coords?.length ? coords[0].lng : null,
  };

  return res.json({ success: true, data: updatedProfile });
});