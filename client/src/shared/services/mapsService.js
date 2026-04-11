// server/services/mapsService.js
// Handles all Google Maps API calls server-side:
//   1. Distance Matrix  → fare calculation at shipment creation
//   2. Directions API   → route optimization at dispatch
//   3. Geocoding        → lat/lng from address string

import axios from 'axios';

const GMAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;
const BASE      = 'https://maps.googleapis.com/maps/api';

// ─────────────────────────────────────────
// 1. DISTANCE MATRIX
//    Used by: POST /api/shipments (fare preview)
// ─────────────────────────────────────────
export async function getDistanceKm(originLatLng, destLatLng) {
  const origin      = `${originLatLng.lat},${originLatLng.lng}`;
  const destination = `${destLatLng.lat},${destLatLng.lng}`;

  const { data } = await axios.get(`${BASE}/distancematrix/json`, {
    params: {
      origins:      origin,
      destinations: destination,
      mode:         'driving',
      key:          GMAPS_KEY,
    },
  });

  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== 'OK') {
    throw new Error(`Distance Matrix error: ${element?.status ?? 'UNKNOWN'}`);
  }

  const meters = element.distance.value;          // e.g. 12400
  const seconds = element.duration.value;         // e.g. 1860
  return {
    km:      parseFloat((meters / 1000).toFixed(2)),
    minutes: Math.ceil(seconds / 60),
  };
}

// ─────────────────────────────────────────
// 2. ROUTE OPTIMIZATION
//    Used by: PATCH /api/hub/assign-route
//    Sends up to 25 waypoints, returns ordered list
// ─────────────────────────────────────────
export async function optimizeRoute(originLatLng, waypointCoords) {
  if (waypointCoords.length === 0) return [];
  if (waypointCoords.length === 1) return [0]; // nothing to optimize

  // Google Directions: waypoints with optimize:true
  const waypointStr = waypointCoords
    .map(p => `${p.lat},${p.lng}`)
    .join('|');

  const { data } = await axios.get(`${BASE}/directions/json`, {
    params: {
      origin:             `${originLatLng.lat},${originLatLng.lng}`,
      destination:        `${originLatLng.lat},${originLatLng.lng}`, // round trip
      waypoints:          `optimize:true|${waypointStr}`,
      mode:               'driving',
      key:                GMAPS_KEY,
    },
  });

  if (data.status !== 'OK') {
    throw new Error(`Directions API error: ${data.status}`);
  }

  // Returns the optimized order of waypoint indices
  return data.routes[0].waypoint_order; // e.g. [3, 1, 0, 2]
}

// ─────────────────────────────────────────
// 3. GEOCODE ADDRESS → lat/lng
//    Used by: shipment creation when merchant types address
// ─────────────────────────────────────────
export async function geocodeAddress(address) {
  const { data } = await axios.get(`${BASE}/geocode/json`, {
    params: { address: `${address}, Kathmandu, Nepal`, key: GMAPS_KEY },
  });

  if (data.status !== 'OK' || !data.results.length) {
    throw new Error(`Geocoding failed for: ${address}`);
  }

  const { lat, lng } = data.results[0].geometry.location;
  const formatted    = data.results[0].formatted_address;
  return { lat, lng, formatted };
}
