// src/modules/merchant/components/AddressAutocomplete.jsx
import { useRef, useState, useEffect } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { useAddressSearch } from "../../../shared/hooks/useAddressSearch.js";

function resolveDistrict(photonProps, districts, label = "") {
  if (!districts?.length || !photonProps) return null;

  const candidates = [
    photonProps.county,
    photonProps.district,
    photonProps.city,
    photonProps.state,
    photonProps.locality,
    photonProps.name,
    ...label.split(",").map((s) => s.trim()),
  ]
    .filter(Boolean)
    .map((s) => s.toLowerCase().trim());

  // Sort longest name first to prefer more specific matches
  const sorted = [...districts].sort((a, b) => b.name.length - a.name.length);

  for (const district of sorted) {
    const dName = district.name.toLowerCase();
    for (const candidate of candidates) {
      if (
        candidate.includes(dName) ||
        dName.includes(candidate) ||
        // Handle "Parsa District" vs "Parsa"
        candidate.replace(/\s*district\s*/i, "").trim() === dName ||
        dName.replace(/\s*district\s*/i, "").trim() === candidate
      ) {
        return district.id;
      }
    }
  }
  return null;
}

export default function AddressAutocomplete({
  label,
  value,
  onChange,
  error,
  required,
  districts = [],
  placeholder = "Start typing address…",
}) {
  const { suggestions, loading, search, clear } = useAddressSearch();

  // raw is fully controlled — initialise from value, keep in sync via key
  // Parent resets by changing value to ""; we detect this below
  const [raw, setRaw] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // ── Sync raw when parent resets value to ""
  // Using layout effect (runs before paint) avoids the cascading-render warning
  // that a regular effect would trigger, while still being safe
  useEffect(() => {
    if (value === "") {
      setRaw("");
      clear();
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // ── Outside click ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (e) => {
    const v = e.target.value;
    setRaw(v);
    search(v);
    setOpen(true);
    if (!v) onChange("", null, null);
  };

  const handleSelect = (suggestion) => {
    console.debug({ raw: suggestion._raw }, "Photon raw props");
    console.debug(
      { districts: districts.map((d) => ({ id: d.id, name: d.name })) },
      "Districts list",
    );

    const districtId = resolveDistrict(
      suggestion._raw,
      districts,
      suggestion.label,
    );
    console.debug({ districtId }, "Resolved districtId");

    setRaw(suggestion.label);
    setOpen(false);
    clear();
    onChange(
      suggestion.label,
      { lat: suggestion.lat, lng: suggestion.lng },
      districtId,
    );
  };

  const handleClear = () => {
    setRaw("");
    clear();
    setOpen(false);
    onChange("", null, null);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">
          {label}
          {required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
      )}

      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors
        bg-white dark:bg-zinc-800
        ${
          error
            ? "border-red-400 dark:border-red-500"
            : "border-gray-300 dark:border-zinc-600 focus-within:border-gray-500 dark:focus-within:border-zinc-400"
        }`}
      >
        <MapPin
          size={13}
          className="text-gray-400 dark:text-zinc-500 shrink-0"
        />
        <input
          value={raw}
          onChange={handleInput}
          onFocus={() => suggestions.length && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
        />
        {loading && (
          <Loader2 size={12} className="animate-spin text-gray-400 shrink-0" />
        )}
        {raw && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 shrink-0"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
                className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <MapPin size={12} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-zinc-300 leading-snug">
                  {s.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
