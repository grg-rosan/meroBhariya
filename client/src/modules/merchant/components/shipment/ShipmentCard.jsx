// src/modules/merchant/components/shipment/components/ShipmentCard.jsx
import { useState } from "react";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import Timeline from "./Timeline.jsx";
import StatusStepper from "./StatusStepper.jsx";
import TransactionDetail from "./TransactionalDetails.jsx";

/**
 * @param {{ s: object }} props
 */
export default function ShipmentCard({ s }) {
  const [open, setOpen] = useState(false);

  const isDelivered = s.status === "DELIVERED";
  const isCancelled = s.status === "CANCELLED";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden mb-3">
      {/* ── Row header ──────────────────────────────────── */}
      <div
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {/* Left: tracking + receiver */}
        <div>
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {s.trackingNumber}
          </p>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">
            {s.receiverName}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {s.deliveryAddress}
          </p>
        </div>

        {/* Right: amounts + status + chevron */}
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              COD Amount
            </p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Rs {s.codAmount.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Status</p>
            {isDelivered ? (
              <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                <CheckCircle size={11} /> Collected
              </span>
            ) : isCancelled ? (
              <span className="text-xs font-medium text-red-400 flex items-center gap-1">
                <XCircle size={11} /> Cancelled
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
                <Clock size={11} /> {s.status.replace(/_/g, " ")}
              </span>
            )}
          </div>

          <div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Remitted</p>
            {s.transaction?.isRemitted ? (
              <span className="text-xs text-green-400">Yes</span>
            ) : (
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                No
              </span>
            )}
          </div>

          <span className="text-zinc-400 dark:text-zinc-500 text-xs select-none">
            {open ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* ── Expanded detail ──────────────────────────────── */}
      {open && (
        <div className="px-5 pb-4 border-t border-zinc-200 dark:border-zinc-800">
          {!isCancelled && <StatusStepper status={s.status} />}
          <TransactionDetail transaction={s.transaction} />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
            Shipment timeline
          </p>
          <Timeline logs={s.logs ?? []} />
        </div>
      )}
    </div>
  );
}
