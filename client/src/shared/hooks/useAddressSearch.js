// src/shared/hooks/useAddressSearch.js
import { useState, useCallback, useRef } from "react";

const PHOTON_URL = "https://photon.komoot.io/api";
const KTM_LAT   = 27.717;
const KTM_LNG   = 85.314;

export function useAddressSearch() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const debounceRef = useRef(null);

  const search = useCallback((value) => {
    setSuggestions([]);
    setError(null);
    if (!value.trim() || value.length < 3) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: value, limit: "6", lang: "en", lat: KTM_LAT, lon: KTM_LNG });
        const res  = await fetch(`${PHOTON_URL}?${params}`);
        if (!res.ok) throw new Error("Address search failed");
        const data = await res.json();
        setSuggestions(data.features.map((f) => ({
          label: formatLabel(f.properties),
          lat:   f.geometry.coordinates[1],
          lng:   f.geometry.coordinates[0],
          _raw:  f.properties, // exposed for district resolution
        })));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const clear = useCallback(() => {
    setSuggestions([]);
    setError(null);
    clearTimeout(debounceRef.current);
  }, []);

  return { suggestions, loading, error, search, clear };
}

function formatLabel(p) {
  const parts = [
    p.name,
    p.street && p.housenumber ? `${p.street} ${p.housenumber}` : p.street,
    p.district, p.city, p.state, p.country,
  ].filter(Boolean);
  return [...new Set(parts)].join(", ");
}