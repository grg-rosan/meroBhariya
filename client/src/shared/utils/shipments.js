// server/routes/shipments.js  (maps-relevant sections)
// POST /api/shipments/fare-preview   → calculate fare before creating
// POST /api/shipments               → create shipment + store geocoded coords
// POST /api/shipments/:id/deliver   → confirm delivery (geofenced)

import express from 'express';
import prisma from '../lib/prisma.js';
import { geocodeAddress }  from '../services/mapsService.js';
import { calculateFare }   from '../services/fareService.js';
import { geofenceCheck }   from '../middleware/geofenceMiddleware.js';
import { authenticate }    from '../middleware/auth.js';
import { requireRole }     from '../middleware/requireRole.js';

const router = express.Router();

// ─────────────────────────────────────────
// FARE PREVIEW  (called live as merchant types address)
// POST /api/shipments/fare-preview
// Body: { pickupAddress, deliveryAddress, weightKg, isFragile, codAmount, vehicleTypeId }
// ─────────────────────────────────────────
router.post('/fare-preview', authenticate, requireRole('MERCHANT'), async (req, res) => {
  const { pickupAddress, deliveryAddress, weightKg, isFragile, codAmount, vehicleTypeId } = req.body;

  try {
    // 1. Geocode both addresses
    const [pickup, delivery] = await Promise.all([
      geocodeAddress(pickupAddress),
      geocodeAddress(deliveryAddress),
    ]);

    // 2. Load fare config for vehicle type
    const fareConfig = await prisma.fareConfig.findUnique({
      where: { vehicleTypeId: parseInt(vehicleTypeId) },
    });
    if (!fareConfig) return res.status(404).json({ error: 'FARE_CONFIG_NOT_FOUND' });

    // 3. Calculate fare
    const result = await calculateFare(fareConfig, {
      originLatLng: { lat: pickup.lat,  lng: pickup.lng },
      destLatLng:   { lat: delivery.lat, lng: delivery.lng },
      weightKg:     parseFloat(weightKg),
      isFragile:    Boolean(isFragile),
      codAmount:    parseFloat(codAmount ?? 0),
    });

    res.json({
      pickup:   { lat: pickup.lat,   lng: pickup.lng,   formatted: pickup.formatted },
      delivery: { lat: delivery.lat, lng: delivery.lng, formatted: delivery.formatted },
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: 'FARE_CALC_FAILED', message: err.message });
  }
});

// ─────────────────────────────────────────
// CREATE SHIPMENT
// POST /api/shipments
// Geocodes addresses, stores PostGIS geography, snaps fare
// ─────────────────────────────────────────
router.post('/', authenticate, requireRole('MERCHANT'), async (req, res) => {
  const {
    receiverName, receiverPhone, deliveryAddress,
    weightKg, isFragile, orderValue, codAmount,
    vehicleTypeId, pickupLatLng, deliveryLatLng, fareSnapshot,
  } = req.body;

  try {
    const merchantProfile = await prisma.merchantProfile.findUnique({
      where: { userId: req.user.id },
    });

    // Geocode delivery address if lat/lng not pre-supplied
    let dLat = deliveryLatLng?.lat;
    let dLng = deliveryLatLng?.lng;
    if (!dLat || !dLng) {
      const geo = await geocodeAddress(deliveryAddress);
      dLat = geo.lat; dLng = geo.lng;
    }

    const trackingNumber = `PTR-${Date.now().toString(36).toUpperCase()}`;

    // Store PostGIS geography using raw query for the Unsupported field
    const shipment = await prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          trackingNumber,
          merchantId:    merchantProfile.id,
          vehicleTypeId: parseInt(vehicleTypeId),
          receiverName,
          receiverPhone,
          deliveryAddress,
          weight:        parseFloat(weightKg),
          isFragile:     Boolean(isFragile),
          orderValue:    parseFloat(orderValue),
          codAmount:     parseFloat(codAmount ?? 0),
          fareSnapshot:  fareSnapshot ? parseFloat(fareSnapshot) : null,
          status:        'PENDING',
        },
      });

      // Update the PostGIS geography column via raw SQL
      await tx.$executeRaw`
        UPDATE "Shipment"
        SET "deliveryLocation" = ST_SetSRID(ST_MakePoint(${dLng}, ${dLat}), 4326)::geography
        WHERE id = ${created.id}
      `;

      return created;
    });

    res.status(201).json({ shipment, trackingNumber });
  } catch (err) {
    res.status(500).json({ error: 'SHIPMENT_CREATE_FAILED', message: err.message });
  }
});

// ─────────────────────────────────────────
// CONFIRM DELIVERY  (geofenced)
// POST /api/shipments/:id/deliver
// Body: { lat, lng, codCollected, podNote }
// Middleware: geofenceCheck rejects if >100m from destination
// ─────────────────────────────────────────
router.post('/:id/deliver', authenticate, requireRole('RIDER'), geofenceCheck, async (req, res) => {
  const { id }          = req.params;
  const { codCollected, podNote } = req.body;
  const rider = await prisma.riderProfile.findUnique({ where: { userId: req.user.id } });

  try {
    const [shipment] = await prisma.$transaction([
      prisma.shipment.update({
        where: { id },
        data: { status: 'DELIVERED', updatedAt: new Date() },
      }),
      prisma.shipmentLog.create({
        data: {
          shipmentId:  id,
          status:      'DELIVERED',
          note:        podNote ?? `Delivered by rider. GPS verified within 100m.`,
          updatedById: req.user.id,
        },
      }),
      prisma.transaction.update({
        where: { shipmentId: id },
        data: { collectedByRider: codCollected ? parseFloat(codCollected) : undefined },
      }),
    ]);

    res.json({ success: true, shipment });
  } catch (err) {
    res.status(500).json({ error: 'DELIVERY_UPDATE_FAILED', message: err.message });
  }
});

export default router;
