import { useState, useEffect } from "react";
import { Sun, Moon, UserCheck } from "lucide-react";
import {
  usePickupQueue,
  useAssignRiderForPickup,
  useAvailableRiders,
} from "../hooks/useDispatcher";
import { useSocket } from "../../../shared/hooks/useSocket";
import { useAuth }   from "../../auth/AuthContext";

// ── helpers ───────────────────────────────────────────────────
const Badge = ({ label, className }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {label}
  </span>
);

// ── BulkAssignModal ───────────────────────────────────────────
function BulkAssignModal({ shipments, onClose, onAssigned, dark }) {
  // Use vehicle type of first selected shipment to pre-filter riders
  const vehicleTypeId                      = shipments[0]?.vehicleType?.id;
  const { riders, loading: ridersLoading } = useAvailableRiders(vehicleTypeId);
  const { assign, loading: assigning }     = useAssignRiderForPickup();
  const [selected, setSelected]            = useState("");
  const [progress, setProgress]            = useState(0);
  const [err, setErr]                      = useState(null);

  const card  = dark ? "bg-zinc-900 border-zinc-700"   : "bg-white border-zinc-200";
  const text  = dark ? "text-white"                    : "text-zinc-900";
  const sub   = dark ? "text-zinc-400"                 : "text-zinc-500";
  const input = dark ? "bg-zinc-800 border-zinc-600 text-white focus:border-violet-500"
                     : "bg-zinc-50  border-zinc-300 text-zinc-900 focus:border-violet-500";
  const tag   = dark ? "bg-zinc-800 text-zinc-300"     : "bg-zinc-100 text-zinc-600";

async function handleAssign() {
  if (!selected) return;
  setErr(null);
  let done = 0;
  const errors = [];

  for (const s of shipments) {
    try {
      await assign(s.id, selected);
      done++;
    } catch (e) {
      errors.push(s.trackingNumber);
    }
    setProgress(Math.round(((done + errors.length) / shipments.length) * 100));
  }

  if (errors.length) {
    setErr(`Failed for: ${errors.join(", ")}`);
  }

  // refresh and close even if some failed — successful ones should disappear
  if (done > 0) {
    onAssigned();
  }
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`${card} border rounded-xl w-full max-w-md p-6 space-y-4`}>

        <div className="flex items-start justify-between">
          <div>
            <h2 className={`${text} font-semibold text-lg`}>Assign Rider</h2>
            <p className={`${sub} text-sm mt-0.5`}>{shipments.length} shipments selected</p>
          </div>
          <button onClick={onClose} className={`${sub} hover:${text} text-xl leading-none`}>×</button>
        </div>

        {/* Selected shipment pills */}
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {shipments.map((s) => (
            <span key={s.id} className={`${tag} px-2 py-0.5 rounded text-xs font-mono`}>
              {s.trackingNumber}
            </span>
          ))}
        </div>

        {/* Rider select */}
        <div className="space-y-1.5">
          <label className={`text-xs ${sub} font-medium uppercase tracking-wide`}>
            Available Riders ({riders.length})
          </label>
          {ridersLoading ? (
            <p className={`${sub} text-sm`}>Loading riders…</p>
          ) : riders.length === 0 ? (
            <p className="text-amber-500 text-sm">No online riders available.</p>
          ) : (
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${input}`}
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

        {/* Progress bar */}
        {assigning && (
          <div className="space-y-1">
            <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={`${sub} text-xs`}>Assigning… {progress}%</p>
          </div>
        )}

        {err && <p className="text-red-400 text-sm">{err}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className={`flex-1 py-2 rounded-lg border ${dark ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"} text-sm`}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selected || assigning}
            className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium"
          >
            {assigning ? `Assigning… ${progress}%` : `Assign to ${shipments.length} shipment${shipments.length > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SingleAssignModal ─────────────────────────────────────────
function SingleAssignModal({ shipment, onClose, onAssigned, dark }) {
  const { riders, loading: ridersLoading } = useAvailableRiders(shipment.vehicleType?.id);
  const { assign, loading: assigning }     = useAssignRiderForPickup();
  const [selected, setSelected]            = useState("");
  const [err, setErr]                      = useState(null);

  const card  = dark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200";
  const text  = dark ? "text-white"                  : "text-zinc-900";
  const sub   = dark ? "text-zinc-400"               : "text-zinc-500";
  const input = dark ? "bg-zinc-800 border-zinc-600 text-white focus:border-violet-500"
                     : "bg-zinc-50  border-zinc-300 text-zinc-900 focus:border-violet-500";
  const summ  = dark ? "bg-zinc-800 text-zinc-300"   : "bg-zinc-50 text-zinc-700";

  async function handleAssign() {
    if (!selected) return;
    setErr(null);
    try {
      await assign(shipment.id, selected);
      onAssigned();
    } catch (e) {
      setErr(e.response?.data?.message ?? "Failed to assign rider.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`${card} border rounded-xl w-full max-w-md p-6 space-y-4`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className={`${text} font-semibold text-lg`}>Assign Rider</h2>
            <p className={`${sub} text-sm mt-0.5`}>
              {shipment.trackingNumber} · {shipment.merchant?.businessName}
            </p>
          </div>
          <button onClick={onClose} className={`${sub} hover:${text} text-xl leading-none`}>×</button>
        </div>

        <div className={`${summ} rounded-lg p-3 text-sm space-y-1`}>
          <p><span className={sub}>Pickup from:</span> {shipment.merchant?.businessName}</p>
          <p><span className={sub}>Deliver to:</span> {shipment.deliveryAddress}</p>
          <p>
            <span className={sub}>Weight:</span> {shipment.weight} kg
            {shipment.isFragile && <Badge label="Fragile" className="bg-amber-500/20 text-amber-400 ml-2" />}
          </p>
          <p>
            <span className={sub}>Payment:</span>{" "}
            {shipment.paymentType === "COD" ? `COD — रू ${shipment.codAmount}` : "Prepaid"}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className={`text-xs ${sub} font-medium uppercase tracking-wide`}>
            Available Riders ({riders.length})
          </label>
          {ridersLoading ? (
            <p className={`${sub} text-sm`}>Loading riders…</p>
          ) : riders.length === 0 ? (
            <p className="text-amber-500 text-sm">No online riders for {shipment.vehicleType?.name}.</p>
          ) : (
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${input}`}
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
            className={`flex-1 py-2 rounded-lg border ${dark ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"} text-sm`}
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
function ShipmentCard({ shipment, onAssign, checked, onCheck, dark }) {
  const time = new Date(shipment.createdAt).toLocaleTimeString("en-NP", {
    hour: "2-digit", minute: "2-digit",
  });

  const card    = dark
    ? `bg-zinc-900 border ${checked ? "border-violet-500" : "border-zinc-800 hover:border-zinc-600"}`
    : `bg-white border ${checked ? "border-violet-500" : "border-zinc-200 hover:border-zinc-400"} shadow-sm`;
  const text    = dark ? "text-white"      : "text-zinc-900";
  const accent  = dark ? "text-violet-400" : "text-violet-600";
  const sub     = dark ? "text-zinc-400"   : "text-zinc-500";
  const muted   = dark ? "text-zinc-600"   : "text-zinc-400";
  const btnBase = dark
    ? "bg-violet-600/20 hover:bg-violet-600 border border-violet-600/40 hover:border-violet-500 text-violet-300 hover:text-white"
    : "bg-violet-50 hover:bg-violet-600 border border-violet-200 hover:border-violet-500 text-violet-600 hover:text-white";

  return (
    <div className={`${card} rounded-xl p-4 space-y-3 transition-colors`}>
      {/* Header with checkbox */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheck(shipment.id, e.target.checked)}
            className="mt-0.5 accent-violet-500 w-4 h-4 cursor-pointer"
          />
          <div>
            <p className={`${text} font-mono text-sm font-semibold`}>{shipment.trackingNumber}</p>
            <p className={`${accent} text-sm font-medium mt-0.5`}>{shipment.merchant?.businessName}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge label={shipment.vehicleType?.name} className={`${dark ? "bg-zinc-700 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`} />
          {shipment.isFragile && <Badge label="Fragile" className="bg-amber-500/20 text-amber-400" />}
        </div>
      </div>

      {/* Details */}
      <div className={`text-xs ${sub} space-y-1`}>
        <p className="flex gap-2">
          <span className={muted}>To</span>
          <span className={`${dark ? "text-zinc-300" : "text-zinc-700"} truncate`}>{shipment.deliveryAddress}</span>
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span><span className={muted}>Zone </span><span className={dark ? "text-zinc-300" : "text-zinc-700"}>{shipment.zone?.name}</span></span>
          <span><span className={muted}>Wt </span><span className={dark ? "text-zinc-300" : "text-zinc-700"}>{shipment.weight} kg</span></span>
          <span>
            {shipment.paymentType === "COD"
              ? <span className="text-emerald-500">COD रू {shipment.codAmount}</span>
              : <span className="text-blue-500">Prepaid</span>}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span><span className={muted}>From </span><span className={dark ? "text-zinc-300" : "text-zinc-700"}>{shipment.fromDistrict?.name}</span></span>
          <span><span className={muted}>To </span><span className={dark ? "text-zinc-300" : "text-zinc-700"}>{shipment.toDistrict?.name}</span></span>
          <span className={`ml-auto ${muted}`}>{time}</span>
        </div>
      </div>

      <button
        onClick={() => onAssign(shipment)}
        className={`w-full py-2 rounded-lg ${btnBase} text-sm font-medium transition-colors`}
      >
        Assign Rider →
      </button>
    </div>
  );
}

// ── PickupQueue ───────────────────────────────────────────────
export default function PickupQueue() {
  const [dark, setDark]             = useState(true);
  const [filters, setFilters]       = useState({});
  const [selected, setSelected]     = useState(new Set());
  const [singleTarget, setSingle]   = useState(null);  // single-card modal
  const [bulkOpen, setBulkOpen]     = useState(false); // bulk modal
  const { user }                    = useAuth();
  const socket                      = useSocket(user?.id);

  const { shipments, loading, error, refresh } = usePickupQueue(filters);

  const zones     = [...new Map(shipments.map((s) => [s.zone?.id,         s.zone        ])).values()].filter(Boolean);
  const districts = [...new Map(shipments.map((s) => [s.fromDistrict?.id, s.fromDistrict])).values()].filter(Boolean);

  useEffect(() => {
    if (!socket) return;
    socket.on("shipment:new", refresh);
    return () => socket.off("shipment:new", refresh);
  }, [socket, refresh]);

  function handleCheck(id, checked) {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(selected.size === shipments.length
      ? new Set()
      : new Set(shipments.map((s) => s.id))
    );
  }

  function handleAssigned() {
    setSingle(null);
    setBulkOpen(false);
    setSelected(new Set());
    refresh();
  }

  const selectedShipments = shipments.filter((s) => selected.has(s.id));
  const allSelected       = shipments.length > 0 && selected.size === shipments.length;

  // theme tokens
  const bg      = dark ? "bg-zinc-950"  : "bg-zinc-50";
  const surface = dark ? "bg-zinc-900"  : "bg-white";
  const border  = dark ? "border-zinc-700" : "border-zinc-200";
  const text    = dark ? "text-white"   : "text-zinc-900";
  const sub     = dark ? "text-zinc-500": "text-zinc-500";
  const selBar  = dark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200";
  const selText = dark ? "text-zinc-300": "text-zinc-700";
  const filterSel = dark
    ? "bg-zinc-800 border-zinc-700 text-zinc-300 focus:border-violet-500"
    : "bg-white border-zinc-300 text-zinc-700 focus:border-violet-500";

  return (
    <div className={`min-h-screen ${bg} ${text} p-6 transition-colors duration-200`}>

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Pickup Queue</h1>
          <p className={`${sub} text-sm mt-0.5`}>Shipments waiting for rider assignment</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-violet-500/20 text-violet-400 border border-violet-500/30 px-3 py-1 rounded-full text-sm font-medium">
            {shipments.length} pending
          </span>
          <button
            onClick={() => setDark((d) => !d)}
            className={`p-2 rounded-lg border ${border} ${sub} hover:${text} transition-colors`}
            title="Toggle theme"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={refresh}
            className={`px-3 py-1.5 rounded-lg border ${border} ${sub} hover:${text} text-sm`}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Filters + select all */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={filters.zoneId ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, zoneId: e.target.value || undefined }))}
          className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none ${filterSel}`}
        >
          <option value="">All zones</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>

        <select
          value={filters.districtId ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, districtId: e.target.value || undefined }))}
          className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none ${filterSel}`}
        >
          <option value="">All districts</option>
          {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        {shipments.length > 0 && (
          <label className={`flex items-center gap-2 text-sm ${sub} cursor-pointer ml-auto`}>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="accent-violet-500 w-4 h-4"
            />
            Select all
          </label>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className={`${selBar} border rounded-xl px-4 py-3 mb-5 flex items-center justify-between`}>
          <p className={`${selText} text-sm`}>
            <span className="text-violet-400 font-semibold">{selected.size}</span> shipment{selected.size > 1 ? "s" : ""} selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className={`px-3 py-1.5 text-sm rounded-lg border ${border} ${sub} hover:${text}`}
            >
              Clear
            </button>
            <button
              onClick={() => setBulkOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium"
            >
              <UserCheck size={15} />
              Assign Rider
            </button>
          </div>
        </div>
      )}

      {/* States */}
      {loading && (
        <div className={`flex justify-center py-20 ${sub} text-sm`}>Loading…</div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}
      {!loading && !error && shipments.length === 0 && (
        <div className={`flex flex-col items-center justify-center py-24 ${sub}`}>
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">No pending shipments</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {shipments.map((s) => (
          <ShipmentCard
            key={s.id}
            shipment={s}
            dark={dark}
            checked={selected.has(s.id)}
            onCheck={handleCheck}
            onAssign={setSingle}
          />
        ))}
      </div>

      {/* Single assign modal */}
      {singleTarget && (
        <SingleAssignModal
          shipment={singleTarget}
          dark={dark}
          onClose={() => setSingle(null)}
          onAssigned={handleAssigned}
        />
      )}

      {/* Bulk assign modal */}
      {bulkOpen && (
        <BulkAssignModal
          shipments={selectedShipments}
          dark={dark}
          onClose={() => setBulkOpen(false)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  );
}