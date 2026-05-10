import { useState, useEffect } from "react";
import {
  usePickupQueue,
  useAssignRiderForPickup,
  useAvailableRiders,
} from "../hooks/useDispatcher";
import { useSocket }   from "../../../shared/hooks/useSocket";
import { useAuth }     from "../../auth/AuthContext";

// ── helpers ───────────────────────────────────────────────────
const Badge = ({ label, className }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {label}
  </span>
);

// ── AssignModal ───────────────────────────────────────────────
function AssignModal({ shipment, onClose, onAssigned }) {
  const { riders, loading: ridersLoading } = useAvailableRiders(shipment.vehicleType?.id);
  const { assign, loading: assigning }     = useAssignRiderForPickup();
  const [selected, setSelected]            = useState("");
  const [err, setErr]                      = useState(null);

  async function handleAssign() {
    if (!selected) return;
    setErr(null);
    try {
      const result = await assign(shipment.id, selected);
      onAssigned(result);
    } catch (e) {
      setErr(e.response?.data?.message ?? "Failed to assign rider.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-white font-semibold text-lg">Assign Rider</h2>
            <p className="text-zinc-400 text-sm mt-0.5">
              {shipment.trackingNumber} · {shipment.merchant?.businessName}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>

        {/* Shipment summary */}
        <div className="bg-zinc-800 rounded-lg p-3 text-sm space-y-1 text-zinc-300">
          <p><span className="text-zinc-500">Pickup from:</span> {shipment.merchant?.businessName}</p>
          <p><span className="text-zinc-500">Deliver to:</span> {shipment.deliveryAddress}</p>
          <p>
            <span className="text-zinc-500">Weight:</span> {shipment.weight} kg
            {shipment.isFragile && (
              <Badge label="Fragile" className="bg-amber-500/20 text-amber-400 ml-2" />
            )}
          </p>
          <p>
            <span className="text-zinc-500">Payment:</span>{" "}
            {shipment.paymentType === "COD"
              ? `COD — रू ${shipment.codAmount}`
              : "Prepaid"}
          </p>
          <p><span className="text-zinc-500">Vehicle:</span> {shipment.vehicleType?.name}</p>
        </div>

        {/* Rider select */}
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-400 font-medium uppercase tracking-wide">
            Available Riders ({riders.length})
          </label>
          {ridersLoading ? (
            <p className="text-zinc-500 text-sm">Loading riders…</p>
          ) : riders.length === 0 ? (
            <p className="text-amber-400 text-sm">
              No online riders available for {shipment.vehicleType?.name}.
            </p>
          ) : (
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
            >
              <option value="">Select a rider…</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.user?.fullName} · {r.vehicleNumber} ({r.vehicleType?.name})
                </option>
              ))}
            </select>
          )}
        </div>

        {err && <p className="text-red-400 text-sm">{err}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-zinc-600 text-zinc-300 text-sm hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selected || assigning}
            className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium"
          >
            {assigning ? "Assigning…" : "Assign Rider"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ShipmentCard ──────────────────────────────────────────────
function ShipmentCard({ shipment, onAssign }) {
  const time = new Date(shipment.createdAt).toLocaleTimeString("en-NP", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 space-y-3 transition-colors">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-white font-mono text-sm font-semibold">{shipment.trackingNumber}</p>
          <p className="text-violet-400 text-sm font-medium mt-0.5">{shipment.merchant?.businessName}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge label={shipment.vehicleType?.name} className="bg-zinc-700 text-zinc-300" />
          {shipment.isFragile && (
            <Badge label="Fragile" className="bg-amber-500/20 text-amber-400" />
          )}
        </div>
      </div>

      {/* Details */}
      <div className="text-xs text-zinc-400 space-y-1">
        <p className="flex gap-2">
          <span className="text-zinc-600">To</span>
          <span className="text-zinc-300 truncate">{shipment.deliveryAddress}</span>
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <span className="text-zinc-600">Zone </span>
            <span className="text-zinc-300">{shipment.zone?.name}</span>
          </span>
          <span>
            <span className="text-zinc-600">Wt </span>
            <span className="text-zinc-300">{shipment.weight} kg</span>
          </span>
          <span>
            {shipment.paymentType === "COD"
              ? <span className="text-emerald-400">COD रू {shipment.codAmount}</span>
              : <span className="text-blue-400">Prepaid</span>}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <span className="text-zinc-600">From </span>
            <span className="text-zinc-300">{shipment.fromDistrict?.name}</span>
          </span>
          <span>
            <span className="text-zinc-600">To </span>
            <span className="text-zinc-300">{shipment.toDistrict?.name}</span>
          </span>
          <span className="ml-auto text-zinc-600">{time}</span>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() => onAssign(shipment)}
        className="w-full py-2 rounded-lg bg-violet-600/20 hover:bg-violet-600 border border-violet-600/40 hover:border-violet-500 text-violet-300 hover:text-white text-sm font-medium transition-colors"
      >
        Assign Rider →
      </button>
    </div>
  );
}

// ── PickupQueue ───────────────────────────────────────────────
export default function PickupQueue() {
  const [filters, setFilters]       = useState({});
  const [activeShipment, setActive] = useState(null);
  const { user }                    = useAuth();
  const socket                      = useSocket(user?.id);

  const { shipments, loading, error, refresh } = usePickupQueue(filters);

  // Derive filter options from loaded shipments
  const zones     = [...new Map(shipments.map((s) => [s.zone?.id,         s.zone        ])).values()].filter(Boolean);
  const districts = [...new Map(shipments.map((s) => [s.fromDistrict?.id, s.fromDistrict])).values()].filter(Boolean);

  // Real-time: new shipment from merchant → refresh queue
  useEffect(() => {
    if (!socket) return;
    socket.on("shipment:new", refresh);
    return () => socket.off("shipment:new", refresh);
  }, [socket, refresh]);

  function handleAssigned() {
    setActive(null);
    refresh();
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Pickup Queue</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Shipments waiting for rider assignment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-1 rounded-full text-sm font-medium">
            {shipments.length} pending
          </span>
          <button
            onClick={refresh}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-sm"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          value={filters.zoneId ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, zoneId: e.target.value || undefined }))}
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-500"
        >
          <option value="">All zones</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>

        <select
          value={filters.districtId ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, districtId: e.target.value || undefined }))}
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-500"
        >
          <option value="">All districts</option>
          {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* States */}
      {loading && (
        <div className="flex justify-center py-20 text-zinc-500 text-sm">Loading…</div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {!loading && !error && shipments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">No pending shipments</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {shipments.map((s) => (
          <ShipmentCard key={s.id} shipment={s} onAssign={setActive} />
        ))}
      </div>

      {/* Assign modal */}
      {activeShipment && (
        <AssignModal
          shipment={activeShipment}
          onClose={() => setActive(null)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  );
}