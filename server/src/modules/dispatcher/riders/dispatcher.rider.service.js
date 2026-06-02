import { prisma } from "../../../config/db.config.js";
// ─── Available riders ─────────────────────────────────────────────────────────
// IN_HUB removed from exclusion list — a rider whose last job is IN_HUB has
// already delivered the package to the hub and is free for a new delivery run.

export async function getAvailableRiders(vehicleTypeId = null) {
  return prisma.riderProfile.findMany({
    where: {
      ...(vehicleTypeId ? { vehicleTypeId: Number(vehicleTypeId) } : {}),
      isOnline:   true,
      isVerified: true,
      shipments: {
        none: {
          status: {
            in: ["AWAITING_PICKUP", "PICKED_UP", "ASSIGNED", "OUT_FOR_DELIVERY"],
          },
        },
      },
    },
    include: {
      user:        { select: { fullName: true, phoneNumber: true } },
      vehicleType: { select: { id: true, name: true } },
    },
  });
}

// ─── Nearest riders (PostGIS) ─────────────────────────────────────────────────
// IN_HUB removed from exclusion list for the same reason as above.

export async function getNearestRiders({ lat, lng, vehicleTypeId = null, limit = 10 }) {
  const riders = await prisma.$queryRaw`
    SELECT
      rp.id,
      rp."vehicleNumber",
      rp."vehicleTypeId",
      u."fullName"                                         AS name,
      u."phoneNumber"                                      AS phone,
      vt.name                                              AS vehicle,
      ST_Distance(
        rp."currentLocation"::geography,
        ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography
      )                                                    AS distance_meters,
      ST_X(rp."currentLocation"::geometry)                AS lng,
      ST_Y(rp."currentLocation"::geometry)                AS lat
    FROM "RiderProfile" rp
    JOIN "User"        u  ON u.id  = rp."userId"
    JOIN "VehicleType" vt ON vt.id = rp."vehicleTypeId"
    WHERE rp."isOnline"        = true
      AND rp."isVerified"      = true
      AND rp."currentLocation" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "Shipment" s
        WHERE s."riderId" = rp.id
          AND s.status IN ('AWAITING_PICKUP','PICKED_UP','ASSIGNED','OUT_FOR_DELIVERY')
      )
      ${vehicleTypeId ? prisma.$raw`AND rp."vehicleTypeId" = ${parseInt(vehicleTypeId)}` : prisma.$raw``}
    ORDER BY distance_meters ASC
    LIMIT ${limit}
  `;
  return riders;
}