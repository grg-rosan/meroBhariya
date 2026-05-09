import { useMemo } from "react";

/**
 * QuotaBar – shows shipmentsUsed / shipmentQuota as a progress bar.
 * Props:
 *   shipmentsUsed   {number}
 *   shipmentQuota   {number}
 *   compact         {boolean}  – slim sidebar variant
 */
export default function QuotaBar({ shipmentsUsed = 0, shipmentQuota = 0, compact = false }) {
  const pct = useMemo(() => {
    if (!shipmentQuota) return 0;
    return Math.min((shipmentsUsed / shipmentQuota) * 100, 100);
  }, [shipmentsUsed, shipmentQuota]);

  const isOver = shipmentsUsed >= shipmentQuota;
  const isWarning = pct >= 80 && !isOver;

  const barColor = isOver
    ? "bg-red-500"
    : isWarning
    ? "bg-amber-400"
    : "bg-emerald-500";

  const labelColor = isOver
    ? "text-red-600 dark:text-red-400"
    : isWarning
    ? "text-amber-600 dark:text-amber-400"
    : "text-slate-500 dark:text-slate-400";

  if (compact) {
    return (
      <div className="w-full space-y-1">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-slate-600 dark:text-slate-300">Quota</span>
          <span className={labelColor}>
            {shipmentsUsed}/{shipmentQuota}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Shipment Quota
          </span>
          {isOver && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm0 9a1.25 1.25 0 110-2.5A1.25 1.25 0 0112 16z" />
              </svg>
              Over Limit
            </span>
          )}
          {isWarning && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 14h-2V9h2v5zm0 4h-2v-2h2v2zM1 21h22L12 2 1 21z" />
              </svg>
              Almost Full
            </span>
          )}
        </div>
        <span className={`text-sm font-bold tabular-nums ${labelColor}`}>
          {pct.toFixed(0)}%
        </span>
      </div>

      {/* Bar */}
      <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
            {shipmentsUsed}
          </span>{" "}
          used
        </span>
        <span>
          <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
            {shipmentQuota - shipmentsUsed > 0 ? shipmentQuota - shipmentsUsed : 0}
          </span>{" "}
          remaining of{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {shipmentQuota}
          </span>
        </span>
      </div>

      {isOver && (
        <p className="text-xs text-red-500 dark:text-red-400 font-medium">
          You've exceeded your quota. Additional shipments incur overage charges.
        </p>
      )}
    </div>
  );
}