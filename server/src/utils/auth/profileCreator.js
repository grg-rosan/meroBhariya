const createMerchantProfile = async (tx, userId, data) => {
  if (!data.pickupDistrictId) {
    throw new AppError("pickupDistrictId is required for merchant registration.", 400);
  }
  return await tx.merchantProfile.create({
    data: {
      userId,
      businessName: data.businessName,
      panNumber: data.panNumber || null,
      pickupAddress: data.pickupAddress,
      pickupDistrictId: Number(data.pickupDistrictId),
    },
  });
};
const createRiderProfile = async (tx, userId, data) => {
  return await tx.riderProfile.create({
    data: {
      userId,
      vehicleTypeId: data.vehicleTypeId,   // Int — must be passed in body
      licenseNumber: data.licenseNumber,    // unique, required
      vehicleNumber: data.vehicleNumber,    // unique, required
    },
  });
};
export { createMerchantProfile, createRiderProfile };