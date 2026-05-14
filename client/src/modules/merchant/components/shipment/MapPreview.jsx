// src/modules/merchant/components/shipment/components/MapPreview.jsx
import { MapPin } from "lucide-react";

/**
 * @param {{
 *   mapContainerRef: React.RefObject<HTMLDivElement>,
 *   hasDeliveryLocation: boolean,
 * }} props
 */
export default function MapPreview({ mapContainerRef, hasDeliveryLocation }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700 flex items-center gap-2">
        <MapPin size={13} className="text-gray-400 dark:text-zinc-500" />
        <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wide">
          Route preview
        </span>
      </div>

      <div className="relative">
        <div ref={mapContainerRef} className="h-56 w-full" />
        {!hasDeliveryLocation && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-zinc-900/70 pointer-events-none">
            <p className="text-xs text-gray-500 dark:text-zinc-500">
              Enter delivery address to see route
            </p>
          </div>
        )}
      </div>
    </div>
  );
}