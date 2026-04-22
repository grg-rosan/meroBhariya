export function calculateFare(config, { weight, isFragile, codAmount, paymentType }) {
  const distanceKm = 5;
  let fare = config.baseFare + config.perKmRate * distanceKm + config.perKgRate * weight;
  if (isFragile) fare += config.fragileCharge;
  if (paymentType === "COD") fare += codAmount * config.codChargeRate;
  const hour = new Date().getHours();
  if (hour >= 21 || hour < 6) fare += config.nightSurcharge;
  return Math.max(fare, config.minFare);
}

export function generateTrackingNumber() {
  const prefix = "MB";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}