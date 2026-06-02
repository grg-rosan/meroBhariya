import { useState } from "react";
import { RefreshCw, UserCheck } from "lucide-react";
import { usePendingShipments, useAssignRider } from "../hooks/useDispatcher";
import { useRiderAssignment } from "../hooks/useRiderAssignment";
import { useToast } from "../../../context/ToastContext";
import ShipmentTable from "../components/routes/ShipmentTable";
import RiderSelector from "../components/routes/RiderSelector";

/**
 * AssignRoutes
 * Orchestrator page: owns selection state, triggers assignment,
 * delegates all rendering to ShipmentTable and RiderSelector.
 */
export default function AssignRoutes() {
const {
    shipments,        
    loading: loadingShipments,
    refetch,
  } = usePendingShipments();

  const { assign, loading: assigning } = useAssignRider();
  const toast = useToast();

  const [selected, setSelected] = useState(new Set());
  const [vehicleTypeId, setVehicleTypeId] = useState("");

  const {
    riders,
    loading: loadingRiders,
    riderId,
    setRiderId,
    selectedRider,
    reset: resetRider,
  } = useRiderAssignment(vehicleTypeId);



  // Unique vehicle types derived from current shipment list
  const vehicleTypes = [
    ...new Map(
      shipments.map((s) => [s.vehicleType?.id, s.vehicleType]),
    ).values(),
  ].filter(Boolean);

  // ── selection helpers ────────────────────────────────────────
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(
      selected.size === shipments.length
        ? new Set()
        : new Set(shipments.map((s) => s.id)),
    );

  // ── vehicle type change ──────────────────────────────────────
  const handleVehicleChange = (id) => {
    setVehicleTypeId(id);
    resetRider();
  };

  // ── assignment ───────────────────────────────────────────────
  const handleAssign = async () => {
    if (!riderId || selected.size === 0) return;
    let successCount = 0;
    for (const shipmentId of selected) {
      try {
        await assign(shipmentId, riderId);
        successCount++;
      } catch {
        // individual error toasted by hook
      }
    }
    if (successCount > 0) {
      toast({
        message: `${successCount} shipment(s) assigned to ${
          selectedRider?.user?.fullName ?? "rider"
        }.`,
        type: "success",
      });
      setSelected(new Set());
      resetRider();
      refetch();
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Assign routes</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
            {shipments.length} pending shipment
            {shipments.length !== 1 ? "s" : ""} waiting for assignment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:bg-zinc-800 transition-all"
          >
            <RefreshCw
              size={12}
              className={loadingShipments ? "animate-spin" : ""}
            />
            Refresh
          </button>
          <button
            onClick={handleAssign}
            disabled={selected.size === 0 || !riderId || assigning}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all"
          >
            <UserCheck size={14} />
            {assigning
              ? "Assigning…"
              : `Assign ${selected.size > 0 ? `(${selected.size})` : ""} to rider`}
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ShipmentTable
            shipments={shipments}
            selected={selected}
            loading={loadingShipments}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />
        </div>

        <RiderSelector
          vehicleTypes={vehicleTypes}
          vehicleTypeId={vehicleTypeId}
          onVehicleChange={handleVehicleChange}
          riders={riders}
          loadingRiders={loadingRiders}
          riderId={riderId}
          onRiderChange={setRiderId}
        />
      </div>
    </div>
  );
}
