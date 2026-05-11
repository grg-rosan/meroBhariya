import { useRiderManifest } from "../hooks/useRider";
import { Navigation, Phone, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ── Status config ─────────────────────────────────────────────
const STATUS = {
  AWAITING_PICKUP: {
    label:  "Go collect",
    color:  "bg-violet-500/10 text-violet-400 border-violet-500/20",
    action: "pickup",
  },
  PICKED_UP: {
    label:  "At hub",
    color:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
    action: null,
  },
  OUT_FOR_DELIVERY: {
    label:  "Delivering",
    color:  "bg-sky-500/10 text-sky-400 border-sky-500/20",
    action: "deliver",
  },
  DELIVERED: {
    label:  "Delivered",
    color:  "bg-green-500/10 text-green-400 border-green-500/20",
    action: null,
  },
};

// ── Stop row ──────────────────────────────────────────────────
function StopRow({ stop, index, isActive }) {
  const nav    = useNavigate();
  const cfg    = STATUS[stop.status] ?? { label: stop.status, color: "bg-zinc-700 text-zinc-400" };
  const isDone = stop.status === "DELIVERED";

  return (
    <div className={`flex items-center gap-4 px-5 py-4 border-b border-zinc-800/50 last:border-none transition-colors ${isActive ? "bg-sky-500/5" : ""}`}>

      {/* Stop number */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
        isDone   ? "bg-green-500/20 text-green-400" :
        isActive ? "bg-sky-500 text-white" :
                   "bg-zinc-800 text-zinc-400"
      }`}>
        {index + 1}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-zinc-200">{stop.receiverName}</p>
          {stop.codAmount > 0 && (
            <span className="text-xs px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full">
              COD रु {stop.codAmount.toLocaleString()}
            </span>
          )}
          {stop.status === "AWAITING_PICKUP" && (
            <span className="text-xs px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full">
              Pickup from {stop.merchant?.businessName}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500 truncate mt-0.5">
          {stop.trackingNumber} · {stop.deliveryAddress} · {stop.weight} kg
        </p>
      </div>

      {/* Actions */}
      <div className="shrink-0">
        {isDone ? (
          <span className={`text-xs px-2 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
        ) : isActive && stop.status === "OUT_FOR_DELIVERY" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => nav("/rider/navigate", { state: { stop } })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-lg transition-all"
            >
              <Navigation size={12} /> Navigate
            </button>
            <a
              href={`tel:${stop.receiverPhone}`}
              className="w-8 h-8 flex items-center justify-center border border-zinc-700 hover:bg-zinc-800 text-zinc-400 rounded-lg transition-all"
            >
              <Phone size={13} />
            </a>
          </div>
        ) : isActive && stop.status === "AWAITING_PICKUP" ? (
          <button
            onClick={() => nav("/rider/scanner", { state: { mode: "pickup", trackingNumber: stop.trackingNumber } })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-all"
          >
            <Package size={12} /> Scan pickup
          </button>
        ) : (
          <span className={`text-xs px-2 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
        )}
      </div>
    </div>
  );
}

// ── RiderManifest ─────────────────────────────────────────────
export default function RiderManifest() {
  const { data, loading, refetch } = useRiderManifest();

  // backend returns array directly from prisma.shipment.findMany
  const stops = Array.isArray(data) ? data : [];
  const done  = stops.filter((s) => s.status === "DELIVERED").length;

  // first non-delivered stop is the active one
  const activeIdx = stops.findIndex((s) => s.status !== "DELIVERED");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 text-zinc-500 text-sm">
        Loading manifest…
      </div>
    );
  }

  if (stops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
        <p className="text-3xl mb-2">📭</p>
        <p className="text-sm">No active shipments</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Today's manifest</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {stops.length} shipment{stops.length !== 1 ? "s" : ""} · {done} completed
          </p>
        </div>
        <button
          onClick={refetch}
          className="text-xs text-zinc-400 border border-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-all"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-zinc-500">Progress</span>
          <span className="text-zinc-300 font-medium">{done} / {stops.length}</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 rounded-full transition-all"
            style={{ width: stops.length ? `${(done / stops.length) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Stop list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {stops.map((stop, i) => (
          <StopRow
            key={stop.id}
            stop={stop}
            index={i}
            isActive={i === activeIdx}
          />
        ))}
      </div>
    </div>
  );
}