import { Banknote, TrendingUp, Package } from "lucide-react";
import { useRiderEarnings } from "../hooks/useRider";
import StatCard from "../../../components/common/StatCard";

// ── Status badge colours ───────────────────────────────────────
// Must match PayoutStatus enum: PENDING | PROCESSING | COMPLETED | FAILED
const STATUS_STYLE = {
  COMPLETED:  "bg-green-500/10 text-green-400",
  PENDING:    "bg-amber-500/10 text-amber-400",
  PROCESSING: "bg-sky-500/10   text-sky-400",
  FAILED:     "bg-red-500/10   text-red-400",
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

// ── Main component ─────────────────────────────────────────────
export default function RiderEarnings() {
  const { data, loading, error } = useRiderEarnings();

  if (error) {
    return (
      <div className="p-4 md:p-6 text-sm text-red-400">
        Failed to load earnings. Please try again.
      </div>
    );
  }

  const payouts   = data?.payouts   ?? [];
  const breakdown = data?.breakdown ?? [];
  const todayTotal = breakdown.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Earnings</h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
          Your income and payout history
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Banknote}   label="This week"    value={`रु ${(data?.week  ?? 0).toLocaleString()}`}       color="green" />
        <StatCard icon={TrendingUp} label="This month"   value={`रु ${(data?.month ?? 0).toLocaleString()}`}       color="sky"   />
        <StatCard icon={Banknote}   label="Available"    value={`रु ${(data?.walletBalance ?? 0).toLocaleString()}`} color="amber" />
        <StatCard icon={Package}    label="Total drops"  value={data?.totalDrops ?? 0}                             color="blue"  />
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
    </div>
  );
}