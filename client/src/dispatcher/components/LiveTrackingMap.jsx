// src/merchant/components/LiveTrackingMap.jsx
// Shows rider's live GPS position moving toward the delivery address.
// Only renders when shipment is OUT_FOR_DELIVERY.
// Polls rider location every 10s via useRiderLocation.

import { useRef, useEffect } from 'react';
import { Navigation2, Clock, MapPin, Radio } from 'lucide-react';
import { useMapbox } from '../../shared/hooks/useMapbox';
import { useRiderLocation } from '../../shared/hooks/useRiderLocation';

export default function LiveTrackingMap({ shipment }) {
  const mapContainerRef = useRef(null);
  const { mapRef, upsertMarker, drawRoute, flyTo } = useMapbox(mapContainerRef, {
    center: [
      shipment.deliveryLocation?.lng ?? 85.314,
      shipment.deliveryLocation?.lat ?? 27.717,
    ],
    zoom: 14,
    style: 'mapbox://styles/mapbox/dark-v11',
  });

  const { location: riderLoc, lastUpdated, error } = useRiderLocation(
    shipment.status === 'OUT_FOR_DELIVERY' ? shipment.id : null
  );

  // Drop delivery pin on mount
  useEffect(() => {
    if (!shipment.deliveryLocation || !mapRef.current) return;
    const { lng, lat } = shipment.deliveryLocation;
    upsertMarker('delivery', [lng, lat], {
      style: 'width:16px;height:16px;border-radius:50%;background:#f43f5e;border:3px solid #fff',
      popup: `<div style="color:#111;font-size:12px;padding:2px 0"><strong>${shipment.receiverName}</strong><br>${shipment.deliveryAddress}</div>`,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef.current, shipment.id]);

  // Update rider marker when location changes
  useEffect(() => {
    if (!riderLoc) return;
    upsertMarker('rider', [riderLoc.lng, riderLoc.lat], {
      style: 'width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2px solid #fff;box-shadow:0 0 0 4px rgba(59,130,246,.3)',
      popup: '<div style="color:#111;font-size:12px">Rider</div>',
    });

    // Draw dashed line from rider to delivery
    if (shipment.deliveryLocation) {
      drawRoute('eta', [
        [riderLoc.lng, riderLoc.lat],
        [shipment.deliveryLocation.lng, shipment.deliveryLocation.lat],
      ]);
    }
  }, [riderLoc, shipment.deliveryLocation, upsertMarker, drawRoute]);

  const timeSince = lastUpdated
    ? `${Math.round((Date.now() - lastUpdated) / 1000)}s ago`
    : null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio size={13} className={`${riderLoc ? 'text-green-400' : 'text-zinc-500'} ${riderLoc ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-medium text-zinc-300">Live tracking — {shipment.trackingNumber}</span>
        </div>
        {timeSince && (
          <span className="text-xs text-zinc-500">Updated {timeSince}</span>
        )}
      </div>

      {/* Map */}
      <div ref={mapContainerRef} className="h-64 w-full" />

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-800 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-zinc-500">Rider</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-zinc-500">{shipment.receiverName}</span>
        </div>

        {error && (
          <span className="text-red-400 ml-auto">GPS signal lost</span>
        )}

        {shipment.status === 'OUT_FOR_DELIVERY' && !riderLoc && !error && (
          <span className="text-zinc-600 ml-auto">Waiting for rider signal…</span>
        )}

        {riderLoc && (
          <button
            onClick={() => flyTo([riderLoc.lng, riderLoc.lat], 15)}
            className="ml-auto flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Navigation2 size={11} /> Center on rider
          </button>
        )}
      </div>
    </div>
  );
}
