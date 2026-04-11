// src/shared/hooks/useRiderLocation.js
// Polls /api/merchant/shipment/:id/rider-location every 10s
// Used by the merchant live tracking map

import { useState, useEffect, useRef } from 'react';
import { authHeaders, API } from './useAPI';

const POLL_INTERVAL_MS = 10_000;

/**
 * @param {string|null} shipmentId - only polls when shipmentId is set
 * @returns {{ location: {lat, lng} | null, lastUpdated: Date | null, error: string | null }}
 */
export function useRiderLocation(shipmentId) {
  const [location, setLocation]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError]             = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!shipmentId) return;

    const poll = async () => {
      try {
        const res  = await fetch(`${API}/api/merchant/shipment/${shipmentId}/rider-location`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.lat && data.lng) {
          setLocation({ lat: data.lat, lng: data.lng });
          setLastUpdated(new Date());
          setError(null);
        }
      } catch (e) {
        setError(e.message);
      }
    };

    poll(); // immediate first call
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [shipmentId]);

  return { location, lastUpdated, error };
}
