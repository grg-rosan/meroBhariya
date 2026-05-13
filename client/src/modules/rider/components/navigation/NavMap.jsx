import { useEffect, useRef, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useMapLibre }         from "../../../../shared/hooks/useMapLibre";
import { useGeolocation } from "../../../../shared/hooks/useGeoLoacation";
import { useRoute, formatDistance, formatDuration } from "../../../../shared/hooks/useRoute";
import { getShipmentDestination } from "../../../../shared/utils/navigation";
export function NavMap({ stop }) {
  const containerRef = useRef(null);
  const { mapRef, upsertMarker, flyTo, drawRoute } = useMapLibre(containerRef);
  const { loc, loading: gpsLoading, request }      = useGeolocation();

  const dest = useMemo(() => getShipmentDestination(stop), [stop]);

  const destLngLat = useMemo(
    () => dest.lat && dest.lng ? [dest.lng, dest.lat] : null,
    [dest]
  );

  const fromLngLat = useMemo(
    () => loc ? [loc.lng, loc.lat] : null,
    [loc]
  );

  const { coordinates, distance, duration, loading: routeLoading } =
    useRoute(fromLngLat, destLngLat);

  useEffect(() => { request(); }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const run = () => {
      if (loc) {
        upsertMarker("rider", [loc.lng, loc.lat], {
          isActive: true,
          popup: `<p style="color:#111;font-size:11px;margin:0">You</p>`,
        });
      }

      if (destLngLat) {
        upsertMarker("dest", destLngLat, {
          isActive: false,
          popup: `<p style="color:#111;font-size:11px;margin:0">${dest.label}</p>`,
        });
        flyTo(destLngLat, 14);
      }

      if (coordinates.length > 0) {
        drawRoute("main", coordinates);
        if (fromLngLat && destLngLat) {
          const bounds = [
            [Math.min(fromLngLat[0], destLngLat[0]), Math.min(fromLngLat[1], destLngLat[1])],
            [Math.max(fromLngLat[0], destLngLat[0]), Math.max(fromLngLat[1], destLngLat[1])],
          ];
          map.fitBounds(bounds, { padding: 60, duration: 1000 });
        }
      }
    };

    map.loaded() ? run() : map.once("load", run);
  }, [loc, destLngLat, coordinates, mapRef, upsertMarker, dest.label, flyTo, drawRoute, fromLngLat]);

  return (
    <div className="bg-gray-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div ref={containerRef} className="h-56 w-full" />

      <div className="px-4 py-3 flex items-center justify-between gap-3 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${loc ? "bg-sky-500 animate-pulse" : "bg-zinc-600"}`} />
          <span className="text-xs text-zinc-400">
            {gpsLoading ? "Getting GPS…" : loc ? "GPS locked" : "No GPS"}
          </span>
        </div>

        {routeLoading && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Loader2 size={11} className="animate-spin" /> Calculating route…
          </div>
        )}

        {!routeLoading && distance && (
          <div className="flex items-center gap-3 text-xs text-zinc-300">
            <span className="text-sky-400 font-medium">{formatDistance(distance)}</span>
            <span className="text-zinc-500">·</span>
            <span>{formatDuration(duration)}</span>
          </div>
        )}
      </div>
    </div>
  );
}