import { useState, useEffect, useRef } from "react";

const OSRM = "https://router.project-osrm.org/route/v1/driving";

export function useRoute(from, to) {
  const [result, setResult] = useState({
    coordinates: [],
    distance:    null,
    duration:    null,
    error:       null,
  });

  // Track loading without state — ref changes don't trigger renders
  // and don't violate the linter rule
  const loadingRef = useRef(false);

  const fromLng = from?.[0];
  const fromLat = from?.[1];
  const toLng   = to?.[0];
  const toLat   = to?.[1];

  useEffect(() => {
    if (
      !isFinite(fromLng) || !isFinite(fromLat) ||
      !isFinite(toLng)   || !isFinite(toLat)
    ) return;

    const controller = new AbortController();

    fetch(
      `${OSRM}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.code !== "Ok") throw new Error(data.message ?? "OSRM error");
        const route = data.routes[0];
        loadingRef.current = false;
        setResult({
          coordinates: route.geometry.coordinates,
          distance:    route.distance,
          duration:    route.duration,
          error:       null,
        });
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        loadingRef.current = false;
        setResult(prev => ({ ...prev, error: e.message }));
      });

    return () => controller.abort();

  }, [fromLng, fromLat, toLng, toLat]);

  // Derive loading from whether coords are provided but result not yet back
  const loading =
    isFinite(fromLng) && isFinite(fromLat) &&
    isFinite(toLng)   && isFinite(toLat)   &&
    result.coordinates.length === 0        &&
    result.error === null;

  return { ...result, loading };
}

export function formatDistance(metres) {
  if (!metres) return "—";
  return metres < 1000
    ? `${Math.round(metres)} m`
    : `${(metres / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds) {
  if (!seconds) return "—";
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}