// utils/fare/computeFare.js
// Master fare calculator — zone + distance + weight + insurance
// insuranceFee is NEVER exposed to merchant — internal only

/**
 * @param {object} fareConfig  - from FareConfig model
 * @param {number} distanceKm  - computed via PostGIS
 * @param {object} zone        - Zone model { surcharge, multiplier }
 * @param {object} options     - { weight, isFragile, orderValue, codAmount, paymentType }
 * @returns {object}           - full fare breakdown
 */
export function computeFare(fareConfig, distanceKm, zone, {
  weight,
  isFragile,
  orderValue,
  codAmount,
  paymentType,
}) {
  const baseFare      = Number(fareConfig.baseFare);
  const distanceFare  = Number(fareConfig.perKmRate) * distanceKm;
  const weightFare    = Number(fareConfig.perKgRate) * Number(weight);
  const fragileCharge = isFragile ? Number(fareConfig.fragileCharge ?? 0) : 0;
  const zoneSurcharge = Number(zone?.surcharge ?? 0);
  const zoneMultiplier = Number(zone?.multiplier ?? 1.0);

  // COD flat fee
  const codFee = paymentType === "COD" && Number(codAmount ?? 0) > 0 ? 15 : 0;

  // Subtotal before multiplier
  const subtotal = (baseFare + distanceFare + weightFare + fragileCharge + zoneSurcharge + codFee)
    * zoneMultiplier;

  // Apply minimum fare floor
  const minFare = Number(fareConfig.minFare ?? 0);
  const adjustedSubtotal = Math.max(subtotal, minFare);

  // Insurance — internal only, never shown to merchant
  const insuranceRate = Number(fareConfig.insuranceRate ?? 1.0);
  const insuranceFee  = Number(orderValue) * (insuranceRate / 100);

  // Total — what merchant sees
  const totalFare = Math.round((adjustedSubtotal + insuranceFee) * 100) / 100;

  return {
    baseFare:      Math.round(baseFare * 100) / 100,
    distanceFare:  Math.round(distanceFare * 100) / 100,
    weightFare:    Math.round(weightFare * 100) / 100,
    fragileCharge: Math.round(fragileCharge * 100) / 100,
    zoneSurcharge: Math.round(zoneSurcharge * 100) / 100,
    codFee,
    insuranceFee:  Math.round(insuranceFee * 100) / 100, // internal only
    totalFare,
  };
}