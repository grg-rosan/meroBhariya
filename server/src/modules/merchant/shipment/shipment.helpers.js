import { prisma } from "../../../config/db.config.js";

export function generateTrackingNumber() {
  const prefix    = "MB";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random    = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ── getDistanceKm ─────────────────────────────────────────────
// Uses PostGIS ST_Distance to calculate distance in km between
// merchant pickup location and delivery coordinates.
export async function getDistanceKm(merchantProfileId, deliveryLat, deliveryLng) {
  const result = await prisma.$queryRaw`
    SELECT
      ST_Distance(
        mp.location::geography,
        ST_SetSRID(ST_MakePoint(${deliveryLng}, ${deliveryLat}), 4326)::geography
      ) / 1000 AS distance_km
    FROM "MerchantProfile" mp
    WHERE mp.id = ${merchantProfileId}
  `;

  if (!result?.length || result[0].distance_km === null) {
    throw new Error("Could not calculate distance. Merchant location may not be set.");
  }

  return parseFloat(result[0].distance_km);
}

// ── calculateFare ─────────────────────────────────────────────
// fareConfig: { baseFare, perKmRate, perKgRate, minFare }
// distanceKm: number
// options:    { weight, isFragile, codAmount, paymentType }

export function calculateFare(fareConfig, distanceKm, { weight, isFragile, codAmount, paymentType }) {
  const base      = Number(fareConfig.baseFare);
  const perKm     = Number(fareConfig.perKmRate);
  const perKg     = Number(fareConfig.perKgRate);
  const minFare   = Number(fareConfig.minFare);

  let fare = base
    + (perKm * distanceKm)
    + (perKg * Number(weight));

  // Fragile surcharge — 10% extra
  if (isFragile) {
    fare += fare * 0.10;
  }

  // COD fee — flat NPR 15
  if (paymentType === "COD" && Number(codAmount ?? 0) > 0) {
    fare += 15;
  }

  // Never go below minimum fare
  fare = Math.max(fare, minFare);

  // Round to 2 decimal places
  return Math.round(fare * 100) / 100;
}