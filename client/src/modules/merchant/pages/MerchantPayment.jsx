// src/modules/merchant/pages/MerchantPayment.jsx
import { useState, useEffect } from "react";
import { CreditCard, Loader2, AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { apiGet } from "../../../shared/hooks/useApi.js";
import { usePayment } from "../hooks/usePayment.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    UNPAID:     { label: "Unpaid",     cls: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20" },
    PENDING:    { label: "Pending",    cls: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20" },
    IN_TRANSIT: { label: "In Transit", cls: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border-violet-200 dark:border-violet-500/20" },
    DELIVERED:  { label: "Delivered",  cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" },
    CANCELLED:  { label: "Cancelled",  cls: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${cls}`}>
      {label}
    </span>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MerchantPayment() {
  const { initiatePayment, loading: payLoading, error: payError } = usePayment();

  const [shipments, setShipments]   = useState([]);
  const [fetching, setFetching]     = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [payingId, setPayingId]     = useState(null); // which shipment is being paid

  const fetchUnpaid = async () => {
    setFetching(true);
    setFetchError(null);
    try {
      // Fetch shipments that are UNPAID — adjust endpoint/params to match your API
      const data = await apiGet("/api/merchant/shipments", { status: "UNPAID", limit: 50 });
      setShipments(data.data?.shipments ?? data.data ?? []);
    } catch (err) {
      setFetchError(err.message ?? "Failed to load shipments.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchUnpaid(); }, []);

  const handlePay = async (shipmentId) => {
    setPayingId(shipmentId);
    try {
      await initiatePayment(shipmentId); // redirects away on success
    } catch {
      // error shown via payError
    } finally {
      setPayingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-500 mt-0.5">
            Pay for your shipments via Khalti
          </p>
        </div>
        <button
          onClick={fetchUnpaid}
          disabled={fetching}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
        >
          <RefreshCw size={13} className={fetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Pay error banner */}
      {payError && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-700/50 rounded-lg">
          <AlertCircle size={14} className="text-red-500 dark:text-red-400 shrink-0" />
          <span className="text-sm text-red-600 dark:text-red-300">{payError}</span>
        </div>
      )}

      {/* Loading */}
      {fetching && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-gray-300 dark:text-zinc-600" />
        </div>
      )}

      {/* Fetch error */}
      {!fetching && fetchError && (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <AlertCircle size={20} className="text-red-400" />
          <p className="text-sm text-gray-500 dark:text-zinc-500">{fetchError}</p>
          <button
            onClick={fetchUnpaid}
            className="text-xs text-rose-500 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!fetching && !fetchError && shipments.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            <CheckCircle size={20} className="text-gray-400 dark:text-zinc-500" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">All caught up</p>
          <p className="text-xs text-gray-400 dark:text-zinc-600">No unpaid shipments at the moment.</p>
        </div>
      )}

      {/* Shipment list */}
      {!fetching && shipments.length > 0 && (
        <div className="space-y-3">
          {shipments.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm flex items-center gap-4"
            >
              {/* Icon */}
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <CreditCard size={15} className="text-gray-400 dark:text-zinc-500" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-800 dark:text-zinc-100 font-mono">
                    {s.trackingNumber}
                  </span>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                  {s.deliveryAddress}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400 dark:text-zinc-600 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(s.createdAt).toLocaleDateString("en-NP", { day: "numeric", month: "short" })}
                  </span>
                  {s.paymentType === "COD" && (
                    <span className="text-xs text-violet-500 dark:text-violet-400 font-medium">COD</span>
                  )}
                </div>
              </div>

              {/* Amount + Pay button */}
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  रु {Number(s.totalFare).toLocaleString()}
                </p>
                {s.status === "UNPAID" && (
                  <button
                    onClick={() => handlePay(s.id)}
                    disabled={payingId === s.id || payLoading}
                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {payingId === s.id
                      ? <><Loader2 size={11} className="animate-spin" /> Redirecting…</>
                      : "Pay now"
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}