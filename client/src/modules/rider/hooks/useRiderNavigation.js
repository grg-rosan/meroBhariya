// src/rider/hooks/useRiderNavigation.js
import { useState } from 'react';

export function useRiderNavigation(initialStops) {
  const [stops, setStops] = useState(initialStops);

  const current = stops[0] ?? null;
  const upcoming = stops.slice(1);

  const completeStop = (trackingNumber) => {
    setStops(prev => prev.filter(s => s.trackingNumber !== trackingNumber));
  };

  return { current, upcoming, totalStops: stops.length, completeStop };
}