// src/shared/components/AddressAutocomplete.jsx
// Google Places Autocomplete input.
// Loads the Places JS library once, biased to Kathmandu bounding box.
//
// Usage:
//   <AddressAutocomplete
//     label="Delivery address"
//     value={form.deliveryAddress}
//     onChange={(address, latLng) => setForm(f => ({ ...f, deliveryAddress: address, deliveryLatLng: latLng }))}
//   />

import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

// Kathmandu valley bounding box for bias
const KTM_BOUNDS = {
  north: 27.80, south: 27.62,
  east:  85.42, west:  85.22,
};

let libraryLoaded  = false;
let libraryLoading = false;
const callbacks    = [];

function loadGooglePlaces(callback) {
  if (libraryLoaded) return callback();
  callbacks.push(callback);
  if (libraryLoading) return;
  libraryLoading = true;

  const script = document.createElement('script');
  script.src   = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&libraries=places&callback=__gmapsLoaded`;
  script.async = true;
  window.__gmapsLoaded = () => {
    libraryLoaded = true;
    callbacks.forEach(cb => cb());
    callbacks.length = 0;
  };
  document.head.appendChild(script);
}

export default function AddressAutocomplete({ label, value, onChange, placeholder = 'Start typing address…', required = false, error }) {
  const inputRef      = useRef(null);
  const acRef         = useRef(null);
  const [ready, setReady] = useState(libraryLoaded);

  useEffect(() => {
    loadGooglePlaces(() => {
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || acRef.current) return;

    acRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      bounds: new window.google.maps.LatLngBounds(
        { lat: KTM_BOUNDS.south, lng: KTM_BOUNDS.west },
        { lat: KTM_BOUNDS.north, lng: KTM_BOUNDS.east }
      ),
      strictBounds: false,
      componentRestrictions: { country: 'np' },
      fields: ['formatted_address', 'geometry.location'],
    });

    acRef.current.addListener('place_changed', () => {
      const place = acRef.current.getPlace();
      if (!place.geometry) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      onChange(place.formatted_address, { lat, lng });
    });
  }, [ready, onChange]);

  return (
    <div>
      {label && (
        <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <div className="relative">
        <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        {!ready && (
          <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" />
        )}
        <input
          ref={inputRef}
          type="text"
          defaultValue={value}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-8 pr-3 py-2.5 text-sm bg-zinc-800 border rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors ${
            error ? 'border-red-500 focus:border-red-400' : 'border-zinc-700 focus:border-zinc-500'
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
