export const generateTrackingNumber = () => `SHP-${nanoid(10).toUpperCase()}`;

/**
 * Calculates fare from FareConfig.
 * Formula: max(minFare, baseFare + (distanceKm * perKmRate) + (weightKg * perKgRate)
 *          + fragileCharge + codCharge + nightSurcharge)
 */
const calculateFare = (config, { distanceKm, weightKg, isFragile, paymentType, isNight }) => {
  let fare = config.baseFare
    + distanceKm * config.perKmRate
    + weightKg   * config.perKgRate;

  if (isFragile)               fare += config.fragileCharge;
  if (paymentType === "COD")   fare += config.codAmount * config.codChargeRate;
  if (isNight)                 fare += config.nightSurcharge;

  return Math.max(fare, config.minFare);
};

const isNightTime = () => {
  const hour = new Date().getHours();
  return hour >= 21 || hour < 6;
};