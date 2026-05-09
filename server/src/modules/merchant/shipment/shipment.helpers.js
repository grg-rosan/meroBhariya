// shipment/shipment.helpers.js
// generateTrackingNumber + getDistanceKm only
// Fare calculation moved to utils/fare/computeFare.js

import { prisma } from "../../../config/db.config.js";

/**
 * Generates a unique tracking number
 * Format: MB-<timestamp base36>-<random>
 */
export function generateTrackingNumber() {
  const prefix    = "MB";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random    = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Calculates distance in km between merchant pickup location
 * and delivery coordinates using PostGIS ST_Distance
 *
 * @param {string} merchantProfileId
 * @param {number} deliveryLat
 * @param {number} deliveryLng
 * @returns {Promise<number>} distance in km
 */
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