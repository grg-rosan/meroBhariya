// src/rider/components/deliver/GpsStatus.jsx
import { Navigation2, Loader2 } from 'lucide-react';

const GEOFENCE_RADIUS = 100;

export function GpsStatus({ loc, loading }) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border mb-5 transition-all ${
      loc ? 'border-green-700/50 bg-green-500/5' : 'border-zinc-700 bg-zinc-900'
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${loc ? 'bg-green-500/10' : 'bg-zinc-800'}`}>
        <Navigation2 size={15} className={loc ? 'text-green-400' : 'text-zinc-500'} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-200">
          {loading ? 'Getting GPS…' : loc ? 'Location acquired' : 'Location required'}
        </p>
        <p className="text-xs text-zinc-500">
          {loc
            ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`
            : `Must be within ${GEOFENCE_RADIUS}m of delivery address`}
        </p>
      </div>
      {loading && <Loader2 size={14} className="text-zinc-500 animate-spin" />}
    </div>
  );
}