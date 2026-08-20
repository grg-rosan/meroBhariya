import { useState } from "react";
import { Banknote, TrendingUp, Package, X } from "lucide-react";
import { useRiderEarnings, useRequestPayout } from "../hooks/useRider";
import StatCard from "../../../components/common/StatCard";

// ── Status badge colours ───────────────────────────────────────
// Must match PayoutStatus enum: PENDING | PROCESSING | COMPLETED | FAILED
const STATUS_STYLE = {
  COMPLETED: "bg-green-500/10 text-green-400",
  PENDING: "bg-amber-500/10 text-amber-400",
  PROCESSING: "bg-sky-500/10   text-sky-400",
  FAILED: "bg-red-500/10   text-red-400",
};

// ── Presentational sub-components ─────────────────────────────
function PayoutRow({ date, amount, method, status }) {
  return (
    <tr className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-blue-950/30">
      <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{date}</td>
      <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{method}</td>
      <td className="px-4 py-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        रु {Number(amount).toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLE[status] ?? "bg-zinc-500/10 text-zinc-400"}`}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
      </td>
    </tr>
  );
}

function BreakdownRow({ label, amount }) {
  const negative = amount < 0;
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-none">
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className={`text-sm font-medium ${negative ? "text-red-400" : "text-zinc-800 dark:text-zinc-200"}`}>
        {negative ? "-" : "+"}रु {Math.abs(amount).toLocaleString()}
      </span>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="py-8 text-sm text-center text-zinc-400 dark:text-zinc-500">
      {message}
    </div>
  );
}

function RequestPayoutModal({ isOpen, onClose, availableBalance, onSubmitted }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("KHALTI");
  const [error, setError] = useState("");
  const { request, loading } = useRequestPayout();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      setError("Minimum payout amount is NPR 100.");
      return;
    }
    if (numAmount > availableBalance) {
      setError(`Requested amount exceeds available balance of NPR ${availableBalance}.`);
      return;
    }

    try {
      await request({ amount: numAmount, method });
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit payout request.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-sm p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-zinc-900 dark:text-white font-semibold text-lg">Request Payout</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Balance Display */}
        <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80 rounded-lg p-3.5 mb-4 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Available Balance</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            रु {Number(availableBalance).toLocaleString()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Payout Amount (NPR)
            </label>
            <input
              type="number"
              min="100"
              placeholder="Min. 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 transition-colors"
              required
            />
          </div>

          {/* Payout method */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Payout Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 transition-colors"
            >
              <option value="KHALTI">Khalti</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-2 text-center bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800/50 py-1.5 px-2.5 rounded">
              {error}
            </p>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || Number(amount) < 100 || Number(amount) > availableBalance}
              className="flex-1 py-2 rounded-lg text-sm text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-amber-600 transition-all font-medium shadow-sm shadow-amber-600/10"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function RiderEarnings() {
  const { data, loading, error, refetch } = useRiderEarnings();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (error) {
    return (
      <div className="p-4 md:p-6 text-sm text-red-400">
        Failed to load earnings. Please try again.
      </div>
    );
  }

  const payouts = data?.payouts ?? [];
  const breakdown = data?.breakdown ?? [];
  const todayTotal = breakdown.reduce((sum, b) => sum + b.amount, 0);
  const walletBalance = data?.walletBalance ?? 0;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Earnings</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
            Your income and payout history
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={walletBalance < 100}
          className="self-start sm:self-center px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title={walletBalance < 100 ? "Minimum balance of NPR 100 required for payout" : ""}
        >
          Request Payout
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Banknote} label="This week" value={`रु ${(data?.week ?? 0).toLocaleString()}`} color="green" />
        <StatCard icon={TrendingUp} label="This month" value={`रु ${(data?.month ?? 0).toLocaleString()}`} color="sky" />
        <StatCard icon={Banknote} label="Available" value={`रु ${walletBalance.toLocaleString()}`} color="amber" />
        <StatCard icon={Package} label="Total drops" value={data?.totalDrops ?? 0} color="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* ── Payout history ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-medium text-white">Payout history</h2>
          </div>

          {loading ? (
            <EmptyState message="Loading…" />
          ) : payouts.length === 0 ? (
            <EmptyState message="No payouts yet." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  {["Date", "Method", "Amount", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => <PayoutRow key={p.id ?? p.date} {...p} />)}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Today's breakdown ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Today's breakdown</h2>

          {loading ? (
            <EmptyState message="Loading…" />
          ) : breakdown.length === 0 ? (
            <EmptyState message="No activity today." />
          ) : (
            <>
              {breakdown.map((b) => <BreakdownRow key={b.label} {...b} />)}
              <div className="mt-3 pt-3 border-t border-zinc-300 dark:border-zinc-700 flex justify-between">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Total today</span>
                <span className="text-lg font-semibold text-green-400">
                  रु {todayTotal.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <RequestPayoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableBalance={walletBalance}
        onSubmitted={() => refetch()}
      />
    </div>
  );
}