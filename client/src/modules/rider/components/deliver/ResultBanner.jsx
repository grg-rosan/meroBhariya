// src/rider/components/deliver/ResultBanner.jsx
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const GEOFENCE_RADIUS = 100;

export function ResultBanner({ result, geofenceError }) {
  if (!result) return null;

  if (result === 'success') return (
    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-700/50 rounded-xl mb-4">
      <CheckCircle size={16} className="text-green-400 shrink-0" />
      <div>
        <p className="text-sm font-medium text-green-300">Delivery confirmed!</p>
        <p className="text-xs text-zinc-500 mt-0.5">GPS verified. Redirecting to manifest…</p>
      </div>
    </div>
  );

  if (result === 'geofence' && geofenceError) return (
    <div className="p-4 bg-red-500/10 border border-red-700/50 rounded-xl mb-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={15} className="text-red-400 shrink-0" />
        <p className="text-sm font-medium text-red-300">Too far from delivery address</p>
      </div>
      <p className="text-xs text-zinc-400 mb-1">
        You are <span className="text-red-400 font-semibold">{geofenceError.distanceMeters}m</span> away.
        Must be within {GEOFENCE_RADIUS}m.
      </p>
      <p className="text-xs text-zinc-500">Navigate to the correct address and try again.</p>
    </div>
  );

  if (result === 'error') return (
    <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-700/50 rounded-xl mb-4">
      <XCircle size={15} className="text-red-400 shrink-0" />
      <p className="text-sm text-red-300">Delivery failed. Try again.</p>
    </div>
  );

  return null;
}