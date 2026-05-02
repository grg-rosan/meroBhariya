// src/modules/dispatcher/pages/AssignRoutes.jsx
import { useState } from "react";
import { CheckSquare, Square, Zap, UserCheck, RefreshCw } from "lucide-react";
import {
  usePendingShipments,
  useAvailableRiders,
  useAssignRider,
} from "../hooks/useDispatcher";
import { useToast } from "../../../context/ToastContext";

export default function AssignRoutes() {
  const {
    data: pendingData,
    loading: loadingShipments,
    refetch,
  } = usePendingShipments();
  const { assign, loading: assigning } = useAssignRider();
  const toast = useToast();

  const [selected, setSelected] = useState(new Set()); // Set of shipment IDs
  const [riderId, setRiderId] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");

  const { data: riders, loading: loadingRiders } =
    useAvailableRiders(vehicleTypeId);

  // Backend returns { shipments, total, page, limit }
  const shipments = pendingData?.shipments ?? [];
  const selectedRider = riders.find((r) => r.id === riderId);

  const toggle = (id) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleAll = () =>
    setSelected(
      selected.size === shipments.length
        ? new Set()
        : new Set(shipments.map((s) => s.id)),
    );

  // Backend assigns one shipment at a time — fire in sequence
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
        message: `${successCount} shipment(s) assigned to ${selectedRider?.user?.fullName ?? "rider"}.`,
        type: "success",
      });
      setSelected(new Set());
      setRiderId("");
      refetch();
    }
  };

  const totalWeight = shipments
    .filter((s) => selected.has(s.id))
    .reduce((sum, s) => sum + (s.weight ?? 0), 0);

  // Get unique vehicle types from shipments for filter
  const vehicleTypes = [
    ...new Map(
      shipments.map((s) => [s.vehicleType?.id, s.vehicleType]),
    ).values(),
  ].filter(Boolean);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Assign routes</h1>
          <p className="text-sm text-gray-400 dark:text-zinc-500 mt-0.5">
            {shipments.length} pending shipment
            {shipments.length !== 1 ? "s" : ""} waiting for assignment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-100 dark:bg-blue-950 transition-all"
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

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Shipment list */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">
              Pending shipments ({shipments.length})
            </h2>
            {shipments.length > 0 && (
              <button
                onClick={toggleAll}
                className="flex items-center gap-1.5 text-xs text-gray-500  hover:text-gray-800 dark:text-zinc-200 transition-colors"
              >
                {selected.size === shipments.length ? (
                  <CheckSquare size={13} className="text-emerald-400" />
                ) : (
                  <Square size={13} />
                )}
                {selected.size === shipments.length
                  ? "Deselect all"
                  : "Select all"}
              </button>
            )}
          </div>

          {loadingShipments ? (
            <div className="px-5 py-10 text-center text-gray-300 dark:text-zinc-600 text-sm">
              Loading…
            </div>
          ) : shipments.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-300 dark:text-zinc-600 text-sm">
              No pending shipments
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800">
                  <th className="px-4 py-2.5 text-left w-8" />
                  {[
                    "Tracking #",
                    "Merchant",
                    "Receiver",
                    "Address",
                    "Weight",
                    "Vehicle",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2.5 text-xs text-gray-400 dark:text-zinc-500 font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`border-b border-gray-200/50 dark:border-zinc-800/50 cursor-pointer transition-colors ${
                      selected.has(s.id)
                        ? "bg-emerald-500/5"
                        : "hover:bg-gray-100 dark:bg-blue-950/30"
                    }`}
                  >
                    <td className="px-4 py-3">
                      {selected.has(s.id) ? (
                        <CheckSquare size={14} className="text-emerald-400" />
                      ) : (
                        <Square
                          size={14}
                          className="text-gray-300 dark:text-zinc-600"
                        />
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-500 dark:text-zinc-400">
                      {s.trackingNumber}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-700 dark:text-zinc-300">
                      {s.merchant?.businessName ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 dark:text-zinc-400">
                      {s.receiverName}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-400 dark:text-zinc-500 truncate max-w-120px">
                      {s.deliveryAddress}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 dark:text-zinc-400">
                      {s.weight} kg
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs bg-gray-100 dark:bg-blue-950 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded">
                        {s.vehicleType?.name ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selected.size > 0 && (
            <div className="px-5 py-3 border-t border-gray-200 dark:border-zinc-800 bg-emerald-500/5 flex items-center justify-between">
              <span className="text-xs text-emerald-400">
                {selected.size} selected · {totalWeight.toFixed(1)} kg total
              </span>
            </div>
          )}
        </div>

        {/* Rider selector */}
        <div className="space-y-3">
          {/* Vehicle type filter */}
          {vehicleTypes.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
              <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-2">
                Filter riders by vehicle type
              </label>
              <select
                value={vehicleTypeId}
                onChange={(e) => {
                  setVehicleTypeId(e.target.value);
                  setRiderId("");
                }}
                className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-blue-950 border border-gray-300  rounded-lg text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-gray-400 dark:border-zinc-600"
              >
                <option value="">All vehicle types</option>
                {vehicleTypes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rider list */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
            <h2 className="text-sm font-medium text-white mb-3">
              Available riders{" "}
              {vehicleTypeId &&
                `· ${vehicleTypes.find((v) => v.id === Number(vehicleTypeId))?.name}`}
            </h2>
            {loadingRiders ? (
              <p className="text-xs text-gray-300 dark:text-zinc-600 text-center py-4">
                Loading riders…
              </p>
            ) : !vehicleTypeId ? (
              <p className="text-xs text-gray-300 dark:text-zinc-600 text-center py-4">
                Select a vehicle type to see available riders
              </p>
            ) : riders.length === 0 ? (
              <p className="text-xs text-gray-300 dark:text-zinc-600 text-center py-4">
                No riders available
              </p>
            ) : (
              <div className="space-y-2">
                {riders.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRiderId(r.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      riderId === r.id
                        ? "border-emerald-500 bg-emerald-500/5"
                        : "border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:bg-blue-950"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-blue-900 text-gray-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center shrink-0">
                      {r.user?.fullName
                        ?.split(" ")
                        .map((w) => w[0])
                        .join("") ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-zinc-200 font-medium">
                        {r.user?.fullName ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">
                        {r.user?.phoneNumber}
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="w-full flex items-center gap-2 justify-center py-2.5 border border-dashed border-gray-300 dark:border-zinc-700 text-gray-400  hover:text-gray-700 dark:text-zinc-300 hover:border-gray-500 dark:hover:border-zinc-500 rounded-xl text-sm transition-all">
            <Zap size={14} /> Auto-assign by zone
          </button>
        </div>
      </div>
    </div>
  );
}
