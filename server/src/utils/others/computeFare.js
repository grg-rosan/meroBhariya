// utils/others/computeFare.js
// Master fare calculator — zone + distance + weight + COD + insurance
// insuranceFee is NEVER exposed to merchant — internal only
// codFee is shown to merchant as part of totalFare

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
  const round = (n) => Math.round(n * 100) / 100;

  const baseFare       = Number(fareConfig.baseFare);
  const distanceFare   = Number(fareConfig.perKmRate) * distanceKm;
  const weightFare     = Number(fareConfig.perKgRate) * Number(weight);
  const fragileCharge  = isFragile ? Number(fareConfig.fragileCharge ?? 0) : 0;
  const zoneSurcharge  = Number(zone?.surcharge   ?? 0);
  const zoneMultiplier = Number(zone?.multiplier  ?? 1.0);

  // COD service fee — percentage of codAmount, only for COD shipments
  // codChargeRate is stored as a percentage e.g. 1.5 = 1.5%
  const codChargeRate = Number(fareConfig.codChargeRate ?? 0);
  const codFee = paymentType === "COD" && Number(codAmount ?? 0) > 0
    ? round(Number(codAmount) * (codChargeRate / 100))
    : 0;

  // Subtotal before zone multiplier
  // codFee is excluded from multiplier — it's a flat service fee on cash amount
  const subtotalBeforeMultiplier =
    (baseFare + distanceFare + weightFare + fragileCharge + zoneSurcharge) * zoneMultiplier;

  // Apply minimum fare floor (on shipping portion only, not codFee)
  const minFare          = Number(fareConfig.minFare ?? 0);
  const shippingSubtotal = Math.max(subtotalBeforeMultiplier, minFare);

  // Insurance — internal only, never shown to merchant
  // Applied to orderValue, not affected by zone multiplier
  const insuranceRate = Number(fareConfig.insuranceRate ?? 1.0);
  const insuranceFee  = round(Number(orderValue) * (insuranceRate / 100));

  // totalFare = what merchant sees and pays via Khalti
  // = shipping + codFee + insuranceFee
  const totalFare = round(shippingSubtotal + codFee + insuranceFee);

  return {
    baseFare:      round(baseFare),
    distanceFare:  round(distanceFare),
    weightFare:    round(weightFare),
    fragileCharge: round(fragileCharge),
    zoneSurcharge: round(zoneSurcharge),
    codFee:        round(codFee),         // shown to merchant
    insuranceFee:  round(insuranceFee),   // internal only — never expose
    totalFare,
  };
}