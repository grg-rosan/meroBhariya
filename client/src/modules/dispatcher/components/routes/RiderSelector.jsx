import { Zap } from "lucide-react";

export default function RiderSelector({
  vehicleTypes,
  vehicleTypeId,
  onVehicleChange,
  riders,
  loadingRiders,
  riderId,
  onRiderChange,
}) {
  const selectedVehicleName =
    vehicleTypes.find((v) => v.id === Number(vehicleTypeId))?.name ?? "";

  return (
    <div className="space-y-3">
      {/* Vehicle type filter */}
      {vehicleTypes.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <label className="text-xs text-zinc-400 dark:text-zinc-500 block mb-2">
            Filter riders by vehicle type
          </label>
          <select
            value={vehicleTypeId}
            onChange={(e) => onVehicleChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-gray-400 dark:border-zinc-600"
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
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
        <h2 className="text-sm font-medium text-white mb-3">
          Available riders{vehicleTypeId && ` · ${selectedVehicleName}`}
        </h2>

        {loadingRiders ? (
          <p className="text-xs text-zinc-300 dark:text-zinc-600 text-center py-4">
            Loading riders…
          </p>
        ) : !vehicleTypeId ? (
          <p className="text-xs text-zinc-300 dark:text-zinc-600 text-center py-4">
            Select a vehicle type to see available riders
          </p>
        ) : riders.length === 0 ? (
          <p className="text-xs text-zinc-300 dark:text-zinc-600 text-center py-4">
            No riders available
          </p>
        ) : (
          <div className="space-y-2">
            {riders.map((r) => (
              <button
                key={r.id}
                onClick={() => onRiderChange(r.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  riderId === r.id
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-blue-900 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center shrink-0">
                  {r.user?.fullName
                    ?.split(" ")
                    .map((w) => w[0])
                    .join("") ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                    {r.user?.fullName ?? "—"}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {r.user?.phoneNumber}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Auto-assign */}
      <button className="w-full flex items-center gap-2 justify-center py-2.5 border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:text-zinc-300 hover:border-gray-500 dark:hover:border-zinc-500 rounded-xl text-sm transition-all">
        <Zap size={14} /> Auto-assign by zone
      </button>
    </div>
  );
}