// src/rider/components/navigation/UpcomingStopRow.jsx
export function UpcomingStopRow({ stop }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3 border-b border-zinc-800/50 last:border-none hover:bg-zinc-800/20 transition-colors">
      <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center text-xs font-medium shrink-0">
        {stop.stopNum}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 font-medium">{stop.receiverName}</p>
        <p className="text-xs text-zinc-600 truncate">{stop.deliveryAddress}</p>
      </div>
      {stop.codAmount > 0 && (
        <span className="text-xs text-amber-400 shrink-0">
          रु {stop.codAmount.toLocaleString()}
        </span>
      )}
    </div>
  );
}