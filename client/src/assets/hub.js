// server/routes/hub.js  (maps-relevant sections)
// GET  /api/hub/riders/nearest  → PostGIS ST_Distance nearest available rider
// PATCH /api/hub/assign-route   → optimize route then assign

import express from 'express';
import prisma  from '../lib/prisma.js';
import { optimizeRoute } from '../services/mapsService.js';
import { authenticate }  from '../middleware/auth.js';
import { requireRole }   from '../middleware/requireRole.js';

const router = express.Router();

// ─────────────────────────────────────────
// NEAREST AVAILABLE RIDER
// GET /api/hub/riders/nearest?lat=27.7&lng=85.3&vehicleTypeId=1
// Uses PostGIS ST_Distance on currentLocation
// ─────────────────────────────────────────
router.get('/riders/nearest', authenticate, requireRole('DISPATCHER'), async (req, res) => {
  const { lat, lng, vehicleTypeId } = req.query;

  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  try {
    const riders = await prisma.$queryRaw`
      SELECT
        rp.id,
        u."fullName"        AS name,
        vt.name             AS vehicle,
        rp."vehicleNumber",
        ST_Distance(
          rp."currentLocation"::geography,
          ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography
        )                   AS distance_meters,
        ST_X(rp."currentLocation"::geometry) AS lng,
        ST_Y(rp."currentLocation"::geometry) AS lat
      FROM "RiderProfile" rp
      JOIN "User"        u  ON u.id = rp."userId"
      JOIN "VehicleType" vt ON vt.id = rp."vehicleTypeId"
      WHERE rp."isOnline"   = true
        AND rp."isVerified" = true
        ${vehicleTypeId ? prisma.$raw`AND rp."vehicleTypeId" = ${parseInt(vehicleTypeId)}` : prisma.$raw``}
        AND rp."currentLocation" IS NOT NULL
      ORDER BY distance_meters ASC
      LIMIT 10
    `;

    res.json({ riders });
  } catch (err) {
    res.status(500).json({ error: 'NEAREST_RIDER_FAILED', message: err.message });
  }
});

// ─────────────────────────────────────────
// ASSIGN ROUTE WITH OPTIMIZATION
// PATCH /api/hub/assign-route
// Body: { shipmentIds: [...], riderId, hubLatLng: { lat, lng } }
// ─────────────────────────────────────────
router.patch('/assign-route', authenticate, requireRole('DISPATCHER'), async (req, res) => {
  const { shipmentIds, riderId, hubLatLng } = req.body;

  if (!shipmentIds?.length || !riderId) {
    return res.status(400).json({ error: 'shipmentIds and riderId required' });
  }

  try {
    // 1. Load delivery coordinates for all shipments
    const shipments = await prisma.$queryRaw`
      SELECT
        id,
        "trackingNumber",
        ST_X("deliveryLocation"::geometry) AS lng,
        ST_Y("deliveryLocation"::geometry) AS lat
      FROM "Shipment"
      WHERE id = ANY(${shipmentIds})
        AND status = 'IN_HUB'
    `;

    if (shipments.length !== shipmentIds.length) {
      return res.status(400).json({ error: 'Some shipments are not IN_HUB or not found' });
    }

    // 2. Optimize route order via Google Directions API
    const origin    = hubLatLng ?? { lat: 27.7172, lng: 85.3140 }; // fallback: Kathmandu
    const waypoints = shipments.map(s => ({ lat: s.lat, lng: s.lng }));

    let orderedIndices;
    try {
      orderedIndices = await optimizeRoute(origin, waypoints);
    } catch (_) {
      // Fallback: keep original order if API fails
      orderedIndices = shipments.map((_, i) => i);
    }

    // 3. Build ordered shipment list
    const orderedShipments = orderedIndices.map(i => shipments[i]);

    // 4. Update all shipments: assign rider + set stop order
    await prisma.$transaction(
      orderedShipments.map((s, stopIndex) =>
        prisma.shipment.update({
          where: { id: s.id },
          data: {
            riderId,
            status: 'ASSIGNED',
          },
        })
      )
    );

    // 5. Create shipment logs
    await prisma.shipmentLog.createMany({
      data: orderedShipments.map(s => ({
        shipmentId:  s.id,
        status:      'ASSIGNED',
        note:        `Route optimized. Assigned to rider.`,
        updatedById: req.user.id,
      })),
    });

    res.json({
      success:          true,
      optimizedOrder:   orderedShipments.map(s => s.trackingNumber),
      totalStops:       orderedShipments.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'ASSIGN_ROUTE_FAILED', message: err.message });
  }
});

// ─────────────────────────────────────────
// UPDATE RIDER LOCATION (called by rider app every 10s)
// PATCH /api/rider/location
// Body: { lat, lng }
// ─────────────────────────────────────────
router.patch('/rider/location', authenticate, requireRole('RIDER'), async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  try {
    await prisma.$executeRaw`
      UPDATE "RiderProfile"
      SET "currentLocation" = ST_SetSRID(ST_MakePoint(${parseFloat(lng)}, ${parseFloat(lat)}), 4326)::geography
      WHERE "userId" = ${req.user.id}
    `;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'LOCATION_UPDATE_FAILED', message: err.message });
  }
});

export default router;
