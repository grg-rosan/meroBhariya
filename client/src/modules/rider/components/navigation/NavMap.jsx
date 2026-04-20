// src/rider/components/navigation/NavMap.jsx
import { useEffect, useRef } from 'react';
import { useMapLibre } from '../../../../shared/hooks/useMapLibre';

export function NavMap({ stops }) {
  const containerRef = useRef(null);
  const { mapRef, upsertMarker, flyTo } = useMapLibre(containerRef);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // map may not be done loading yet — wait for it
    const pinStops = () => {
      stops.forEach((stop, i) => {
        if (!stop?.lngLat) return;
        upsertMarker(stop.trackingNumber, stop.lngLat, {
          isActive: i === 0,
          popup: `<p style="color:#111;font-size:12px;margin:0">${stop.receiverName}</p>`,
        });
      });
      if (stops[0]?.lngLat) flyTo(stops[0].lngLat, 14);
    };

    if (map.loaded()) {
      pinStops();
    } else {
      map.once('load', pinStops);
    }
  }, [stops, flyTo,mapRef,upsertMarker]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div ref={containerRef} className="h-52 w-full" />
      <div className="px-5 py-3 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
        <span className="text-xs text-zinc-400">Live GPS · Last updated just now</span>
      </div>
    </div>
  );
}