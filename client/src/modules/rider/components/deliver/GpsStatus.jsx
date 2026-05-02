// src/rider/components/deliver/GpsStatus.jsx
import { Navigation2, Loader2 } from "lucide-react";

const GEOFENCE_RADIUS = 100;

export function GpsStatus({ loc, loading }) {
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border mb-5 transition-all ${
        loc
          ? "border-green-700/50 bg-green-500/5"
          : "border-gray-300 dark:border-zinc-700 bg-white dark:bg-gray-900"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${loc ? "bg-green-500/10" : "bg-gray-100 dark:bg-blue-950"}`}
      >
        <Navigation2
          size={15}
          className={
            loc ? "text-green-400" : "text-gray-400 dark:text-zinc-500"
          }
        />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">
          {loading
            ? "Getting GPS…"
            : loc
              ? "Location acquired"
              : "Location required"}
        </p>
        <p className="text-xs text-gray-400 dark:text-zinc-500">
          {loc
            ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
            : `Must be within ${GEOFENCE_RADIUS}m of delivery address`}
        </p>
      </div>
      {loading && (
        <Loader2
          size={14}
          className="text-gray-400 dark:text-zinc-500 animate-spin"
        />
      )}
    </div>
  );
}
