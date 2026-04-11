// server/services/fareService.js
// Calculates the final fare for a shipment using:
//   - FareConfig from DB (baseFare, perKmRate, perKgRate, etc.)
//   - Real road distance from Google Distance Matrix

import { getDistanceKm } from './mapsService.js';

/**
 * Calculate the fare for a shipment.
 * @param {object} config  - FareConfig row from DB
 * @param {object} params  - { originLatLng, destLatLng, weightKg, isFragile, codAmount, isNight }
 * @returns {{ fareBreakdown, totalFare, distanceKm, etaMinutes }}
 */
export async function calculateFare(config, params) {
  const {
    originLatLng, destLatLng,
    weightKg, isFragile = false,
    codAmount = 0,
    isNight = isNightTime(),
  } = params;

  // 1. Get real road distance
  const { km, minutes } = await getDistanceKm(originLatLng, destLatLng);

  // 2. Build fare breakdown
  const baseFare       = config.baseFare;
  const distanceFare   = parseFloat((km * config.perKmRate).toFixed(2));
  const weightFare     = parseFloat((weightKg * config.perKgRate).toFixed(2));
  const fragileCharge  = isFragile ? config.fragileCharge : 0;
  const codCharge      = codAmount > 0
    ? parseFloat((codAmount * (config.codChargeRate / 100)).toFixed(2))
    : 0;
  const nightSurcharge = isNight ? config.nightSurcharge : 0;

  const subtotal = baseFare + distanceFare + weightFare + fragileCharge + codCharge + nightSurcharge;
  const totalFare = Math.max(subtotal, config.minFare);

  return {
    distanceKm:   km,
    etaMinutes:   minutes,
    fareBreakdown: {
      baseFare,
      distanceFare,
      weightFare,
      fragileCharge,
      codCharge,
      nightSurcharge,
      subtotal:  parseFloat(subtotal.toFixed(2)),
      minFareApplied: subtotal < config.minFare,
    },
    totalFare: parseFloat(totalFare.toFixed(2)),
  };
}

function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 21 || hour < 6; // 9 PM – 6 AM
}
