import { CheckSquare, Square } from "lucide-react";
import ShipmentTableRow from "./ShipmentTableRow";

const COLUMNS = ["Tracking #", "Merchant", "Receiver", "Address", "Weight", "Vehicle"];

export default function ShipmentTable({
  shipments,
  selected,
  loading,
  onToggle,
  onToggleAll,
}) {
  const allSelected = shipments.length > 0 && selected.size === shipments.length;

  const totalWeight = shipments
    .filter((s) => selected.has(s.id))
    .reduce((sum, s) => sum + (s.weight ?? 0), 0);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-medium text-white">
          Pending shipments ({shipments.length})
        </h2>
        {shipments.length > 0 && (
          <button
            onClick={onToggleAll}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 dark:text-zinc-200 transition-colors"
          >
            {allSelected ? (
              <CheckSquare size={13} className="text-emerald-400" />
            ) : (
              <Square size={13} />
            )}
            {allSelected ? "Deselect all" : "Select all"}
          </button>
        )}
      </div>

      {/* Body */}
      {loading ? (
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
              {COLUMNS.map((h) => (
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
              <ShipmentTableRow
                key={s.id}
                shipment={s}
                selected={selected.has(s.id)}
                onToggle={onToggle}
              />
            ))}
          </tbody>
        </table>
      )}

      {/* Summary footer */}
      {selected.size > 0 && (
        <div className="px-5 py-3 border-t border-gray-200 dark:border-zinc-800 bg-emerald-500/5 flex items-center justify-between">
          <span className="text-xs text-emerald-400">
            {selected.size} selected · {totalWeight.toFixed(1)} kg total
          </span>
        </div>
      )}
    </div>
  );
}