import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { usePickupQueue } from "../hooks/useDispatcher";
import { useSocket } from "../../../shared/hooks/useSocket";
import { useAuth } from "../../auth/AuthContext";
import { useThemeTokens } from "../../../shared/hooks/useTheme.js";
import ShipmentCard from "../components/pickup/ShipmentCard";
import FilterBar from "../components/pickup/FilterBar";
import BulkActionBar from "../components/pickup/BulkActionBar";
import SingleAssignModal from "../components/pickup/SingleAssignModal";
import BulkAssignModal from "../components/pickup/BulkAssignModal";

export default function PickupQueue() {
  const [dark, setDark] = useState(true);
  const [filters, setFilters] = useState({});
  const [selected, setSelected] = useState(new Set());
  const [singleTarget, setSingle] = useState(null); // shipment for single modal
  const [bulkOpen, setBulkOpen] = useState(false);

  const { user } = useAuth();
  const socket = useSocket(user?.id);
  const t = useThemeTokens(dark);

  const { shipments, loading, error, refresh } = usePickupQueue(filters);

  // Derive filter options from loaded shipments
  const zones = [
    ...new Map(shipments.map((s) => [s.zone?.id, s.zone])).values(),
  ].filter(Boolean);
  const districts = [
    ...new Map(
      shipments.map((s) => [s.fromDistrict?.id, s.fromDistrict]),
    ).values(),
  ].filter(Boolean);

  const selectedShipments = shipments.filter((s) => selected.has(s.id));
  const allSelected =
    shipments.length > 0 && selected.size === shipments.length;

  // ── socket ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    socket.on("shipment:new", refresh);
    return () => socket.off("shipment:new", refresh);
  }, [socket, refresh]);

  // ── handlers ────────────────────────────────────────────────
  function handleCheck(id, checked) {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(shipments.map((s) => s.id)));
  }

  function handleFilter(patch) {
    setFilters((f) => ({ ...f, ...patch }));
  }

  function handleAssigned() {
    setSingle(null);
    setBulkOpen(false);
    setSelected(new Set());
    refresh();
  }

  // ── render ───────────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen ${t.bg} ${t.text} p-6 transition-colors duration-200`}
    >
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Pickup Queue</h1>
          <p className={`${t.sub} text-sm mt-0.5`}>
            Shipments waiting for rider assignment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-violet-500/20 text-violet-400 border border-violet-500/30 px-3 py-1 rounded-full text-sm font-medium">
            {shipments.length} pending
          </span>
          <button
            onClick={() => setDark((d) => !d)}
            className={`p-2 rounded-lg border ${t.border} ${t.sub} hover:${t.text} transition-colors`}
            title="Toggle theme"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={refresh}
            className={`px-3 py-1.5 rounded-lg border ${t.border} ${t.sub} hover:${t.text} text-sm`}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        zones={zones}
        districts={districts}
        filters={filters}
        onFilterChange={handleFilter}
        allSelected={allSelected}
        showSelectAll={shipments.length > 0}
        onSelectAll={toggleSelectAll}
        filterSelClass={t.filterSel}
        subClass={t.sub}
      />

      {/* Bulk action bar */}
      <BulkActionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onAssign={() => setBulkOpen(true)}
        barClass={t.selBar}
        textClass={t.selText}
        borderClass={t.border}
        subClass={t.sub}
      />

      {/* Loading / error / empty states */}
      {loading && (
        <div className={`flex justify-center py-20 ${t.sub} text-sm`}>
          Loading…
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {!loading && !error && shipments.length === 0 && (
        <div
          className={`flex flex-col items-center justify-center py-24 ${t.sub}`}
        >
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">No pending shipments</p>
        </div>
      )}

      {/* Card grid */}
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

      {/* Modals */}
      {singleTarget && (
        <SingleAssignModal
          shipment={singleTarget}
          dark={dark}
          onClose={() => setSingle(null)}
          onAssigned={handleAssigned}
        />
      )}
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
