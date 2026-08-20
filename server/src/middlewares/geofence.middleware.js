import { prisma } from "../config/db.config.js";

const DELIVERY_RADIUS_METERS = 100;

export async function geofenceCheck(req, res, next) {
  const body = req.body ?? {};

  // ── DEV BYPASS ────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    req.riderLocation = {
      lat: parseFloat(body.lat) || 0,
      lng: parseFloat(body.lng) || 0,
    };
    return next();
  }
  // ─────────────────────────────────────────────────────────────────────────

  const { id: shipmentId } = req.params;
  const { lat, lng } = body;

  if (!lat || !lng) {
    return res.status(400).json({
      error: "LOCATION_REQUIRED",
      message: "Rider GPS coordinates are required to confirm delivery.",
    });
  }

  const shipment = await prisma.$queryRaw`
    SELECT
      id,
      ST_X("deliveryLocation"::geometry) AS dest_lng,
      ST_Y("deliveryLocation"::geometry) AS dest_lat,
      ST_DWithin(
        "deliveryLocation"::geography,
        ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography,
        ${DELIVERY_RADIUS_METERS}
      ) AS within_range
    FROM "Shipment"
    WHERE id = ${shipmentId}
      AND status = 'OUT_FOR_DELIVERY'
  `;

  if (!shipment.length) {
    return res.status(404).json({
      error: "SHIPMENT_NOT_FOUND",
      message: "Shipment not found or not in OUT_FOR_DELIVERY state.",
    });
  }

  const { within_range, dest_lat, dest_lng } = shipment[0];

  if (!within_range) {
    const distResult = await prisma.$queryRaw`
      SELECT
        ROUND(
          ST_Distance(
            "deliveryLocation"::geography,
            ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography
          )::numeric, 1
        ) AS distance_meters
      FROM "Shipment"
      WHERE id = ${shipmentId}
    `;

    const distanceMeters = distResult[0]?.distance_meters ?? "unknown";

    return res.status(403).json({
      error: "OUTSIDE_GEOFENCE",
      message: `You must be within ${DELIVERY_RADIUS_METERS}m of the delivery address. You are currently ${distanceMeters}m away.`,
      distanceMeters,
      requiredMeters: DELIVERY_RADIUS_METERS,
      destinationHint: { lat: dest_lat, lng: dest_lng },
    });
  }

  req.riderLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
  next();
}