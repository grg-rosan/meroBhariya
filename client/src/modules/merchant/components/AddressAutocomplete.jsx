// src/modules/merchant/components/AddressAutocomplete.jsx
import { useRef, useEffect } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { useAddressSearch } from "../../../shared/hooks/useAddressSearch.js";

export default function AddressAutocomplete({
  label,
  value,
  onChange,
  placeholder = "Start typing address…",
  required = false,
  error,
}) {
  const { query, suggestions, loading, search, clear } = useAddressSearch();
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        // Don't clear — just close suggestions by blurring
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (suggestion) => {
    onChange(suggestion.label, { lat: suggestion.lat, lng: suggestion.lng });
    clear();
  };

  const handleClear = () => {
    onChange("", null);
    clear();
  };

  // Display: if a place is selected (value set by parent), show that.
  // Otherwise show what user is typing (query).
  const displayValue = value && !query ? value : query;

  return (
    <div ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Pin icon */}
        <MapPin
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none"
        />

        {/* Input */}
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            // If user starts typing after a selection, clear the selection
            if (value) onChange("", null);
            search(e.target.value);
          }}
          placeholder={placeholder}
          className={`w-full pl-8 pr-8 py-2.5 text-sm rounded-lg border focus:outline-none transition-colors
            bg-white dark:bg-zinc-800
            text-gray-900 dark:text-zinc-100
            placeholder-gray-400 dark:placeholder-zinc-500
            ${error
              ? "border-red-400 dark:border-red-500 focus:border-red-500"
              : "border-gray-300 dark:border-zinc-600 focus:border-gray-500 dark:focus:border-zinc-400"
            }`}
        />

        {/* Right icon — spinner or clear */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 size={13} className="text-gray-400 animate-spin" />
          ) : (value || query) ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <MapPin size={12} className="text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">
                    {s.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}