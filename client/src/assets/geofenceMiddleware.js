// server/middleware/geofenceMiddleware.js
// Uses PostGIS ST_DWithin to verify the rider is within
// DELIVERY_RADIUS_METERS of the package's deliveryLocation
// before allowing "Mark as Delivered."
//
// Attach to: PATCH /api/shipments/:id/deliver

import prisma from '../lib/prisma.js';

const DELIVERY_RADIUS_METERS = 100; // reject if rider is >100m away

export async function geofenceCheck(req, res, next) {
  const { id: shipmentId } = req.params;
  const { lat, lng }       = req.body; // rider's current GPS from app

  if (!lat || !lng) {
    return res.status(400).json({
      error: 'LOCATION_REQUIRED',
      message: 'Rider GPS coordinates are required to confirm delivery.',
    });
  }

  // 1. Load the shipment's delivery location from DB
  const shipment = await prisma.$queryRaw`
    SELECT
      id,
      ST_X(delivery_location::geometry) AS dest_lng,
      ST_Y(delivery_location::geometry) AS dest_lat,
      ST_DWithin(
        delivery_location::geography,
        ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography,
        ${DELIVERY_RADIUS_METERS}
      ) AS within_range
    FROM "Shipment"
    WHERE id = ${shipmentId}
      AND status = 'OUT_FOR_DELIVERY'
    LIMIT 1
  `;

  if (!shipment.length) {
    return res.status(404).json({
      error: 'SHIPMENT_NOT_FOUND',
      message: 'Shipment not found or not in OUT_FOR_DELIVERY state.',
    });
  }

  const { within_range, dest_lat, dest_lng } = shipment[0];

  if (!within_range) {
    // Calculate actual distance for debugging / error message
    const distResult = await prisma.$queryRaw`
      SELECT
        ROUND(
          ST_Distance(
            delivery_location::geography,
            ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography
          )::numeric, 1
        ) AS distance_meters
      FROM "Shipment"
      WHERE id = ${shipmentId}
    `;

    const distanceMeters = distResult[0]?.distance_meters ?? 'unknown';

    return res.status(403).json({
      error:           'OUTSIDE_GEOFENCE',
      message:         `You must be within ${DELIVERY_RADIUS_METERS}m of the delivery address. You are currently ${distanceMeters}m away.`,
      distanceMeters,
      requiredMeters:  DELIVERY_RADIUS_METERS,
      destinationHint: { lat: dest_lat, lng: dest_lng },
    });
  }

  // Rider is close enough — attach coords to request for downstream use
  req.riderLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
  next();
}
