import { Plus } from "lucide-react";
import { useFareConfigs, useUpsertFare } from "../hooks/useAdmin";
import FareCard from "../components/fleet/FareCard";

export default function FleetFares() {
  const { data, loading }          = useFareConfigs();
  const { upsert, loading: saving } = useUpsertFare();

  const configs = Array.isArray(data) ? data : (data?.configs ?? []);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Fleet & fare config</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
            Set per-km, per-kg, and surcharge rates per vehicle type
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-sm rounded-lg font-medium transition-all">
          <Plus size={14} /> Add vehicle type
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 mb-6 text-xs text-zinc-400 dark:text-zinc-500">
       <strong className="text-zinc-500 dark:text-zinc-400">Fare formula: </strong>
Base fare + (distance × per km rate) + (weight × per kg rate) + fragile charge + COD charge (% of COD amount).
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : configs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-10 text-center text-zinc-300 dark:text-zinc-600 text-sm">
          No fare configs found. Add a vehicle type to get started.
        </div>
      ) : (
        configs.map((c) => (
          <FareCard
            key={c.vehicleTypeId ?? c.id}
            config={c}
            onSave={upsert}
            saving={saving}
          />
        ))
      )}
    </div>
  );
}