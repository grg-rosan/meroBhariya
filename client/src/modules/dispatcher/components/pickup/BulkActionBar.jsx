import { UserCheck } from "lucide-react";

/**
 * BulkActionBar
 * Shown when 1+ shipments are selected in PickupQueue.
 * Displays count, clear button, and "Assign Rider" CTA.
 *
 * Props
 * ─────
 * count          {number}
 * onClear        {fn}
 * onAssign       {fn}
 * barClass       {string}  – theme-aware bg + border classes
 * textClass      {string}
 * borderClass    {string}
 * subClass       {string}
 */
export default function BulkActionBar({
  count,
  onClear,
  onAssign,
  barClass = "bg-zinc-900 border-zinc-700",
  textClass = "text-zinc-300",
  borderClass = "border-zinc-700",
  subClass = "text-zinc-500",
}) {
  if (count === 0) return null;

  return (
    <div
      className={`${barClass} border rounded-xl px-4 py-3 mb-5 flex items-center justify-between`}
    >
      <p className={`${textClass} text-sm`}>
        <span className="text-violet-400 font-semibold">{count}</span>{" "}
        shipment{count > 1 ? "s" : ""} selected
      </p>
      <div className="flex gap-2">
        <button
          onClick={onClear}
          className={`px-3 py-1.5 text-sm rounded-lg border ${borderClass} ${subClass} hover:text-white`}
        >
          Clear
        </button>
        <button
          onClick={onAssign}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium"
        >
          <UserCheck size={15} />
          Assign Rider
        </button>
      </div>
    </div>
  );
}