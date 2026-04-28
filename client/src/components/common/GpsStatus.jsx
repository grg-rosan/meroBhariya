// src/shared/components/GpsStatus.jsx
import { Navigation2, Loader2 } from "lucide-react";

export default function GpsStatus({ geo, radius }) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border mb-5 transition-all ${
      geo.loc ? "border-green-700/50 bg-green-500/5" : "border-zinc-700 bg-zinc-900"
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        geo.loc ? "bg-green-500/10" : "bg-zinc-800"
      }`}>
        <Navigation2 size={15} className={geo.loc ? "text-green-400" : "text-zinc-500"} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-200">
          {geo.loading ? "Getting GPS…" : geo.loc ? "Location acquired" : "Location required"}
        </p>
        <p className="text-xs text-zinc-500">
          {geo.loc
            ? `${geo.loc.lat.toFixed(5)}, ${geo.loc.lng.toFixed(5)}`
            : `Must be within ${radius}m of delivery address`}
        </p>
      </div>
      {geo.loading && <Loader2 size={14} className="text-zinc-500 animate-spin" />}
    </div>
  );
}