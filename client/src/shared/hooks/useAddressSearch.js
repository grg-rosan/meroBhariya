// src/shared/hooks/useAddressSearch.js
// Photon (by Komoot) address search — free, no API key, OpenStreetMap data.
// Consistent with MapLibre + OpenFreeMap tiles already used in the app.

import { useState, useCallback, useRef } from "react";

const PHOTON_URL = "https://photon.komoot.io/api";

// Kathmandu center for location bias
const KTM_LAT = 27.717;
const KTM_LNG = 85.314;

export function useAddressSearch() {
  const [query,       setQuery]       = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const debounceRef = useRef(null);

  const search = useCallback((value) => {
    setQuery(value);
    setSuggestions([]);
    setError(null);

    if (!value.trim() || value.length < 3) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q:     value,
          limit: "6",
          lang:  "en",
          lat:   KTM_LAT,  // bias results toward Kathmandu
          lon:   KTM_LNG,
        });

        const res = await fetch(`${PHOTON_URL}?${params}`);
        if (!res.ok) throw new Error("Address search failed");

        const data = await res.json();

        // Photon returns GeoJSON FeatureCollection
        setSuggestions(
          data.features.map((f) => ({
            label: formatLabel(f.properties),
            lat:   f.geometry.coordinates[1],
            lng:   f.geometry.coordinates[0],
          }))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setError(null);
    clearTimeout(debounceRef.current);
  }, []);

  return { query, suggestions, loading, error, search, clear };
}

// ─── Format Photon feature properties into a readable address string ──────────
// Photon returns: name, street, housenumber, city, state, country, postcode
function formatLabel(p) {
  const parts = [
    p.name,
    p.street && p.housenumber ? `${p.street} ${p.housenumber}` : p.street,
    p.district,
    p.city,
    p.state,
    p.country,
  ].filter(Boolean);

  // Deduplicate consecutive identical parts
  return [...new Set(parts)].join(", ");
}