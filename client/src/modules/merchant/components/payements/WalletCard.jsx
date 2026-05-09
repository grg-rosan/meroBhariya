// src/modules/merchant/components/payments/WalletCard.jsx

import { useState } from "react";
import { Wallet, TrendingUp, TrendingDown, RefreshCw, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";

/**
 * WalletCard
 * Props:
 *   balance         {number}  – current wallet balance
 *   lastTransaction {object}  – { type, amount, description, createdAt } | null
 *   loading         {boolean} – skeleton state
 *   error           {string}  – error message
 *   topupLoading    {boolean} – top-up in flight
 *   onTopup         {fn}      – called with (amount: number)
 *   onRefetch       {fn}      – refetch balance
 */
export default function WalletCard({
  balance,
  lastTransaction,
  loading,
  error,
  topupLoading,
  onTopup,
  onRefetch,
}) {
  const [topupOpen, setTopupOpen] = useState(false);
  const [amount, setAmount]       = useState("");
  const [amountError, setAmountError] = useState("");

  const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

  const handleTopup = async () => {
    const parsed = Number(amount);
    if (!parsed || parsed < 100) {
      setAmountError("Minimum top-up is Rs. 100");
      return;
    }
    setAmountError("");
    try {
      await onTopup(parsed);
      setTopupOpen(false);
      setAmount("");
    } catch {
      // error surfaced by parent via topupError
    }
  };

  const fmt = (n) =>
    typeof n === "number"
      ? `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      : "—";

  const txIcon =
    lastTransaction?.type === "TOPUP" ? (
      <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-red-400" />
    );

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-9 w-40 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-32 rounded-xl bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-6 shadow-sm flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={onRefetch}
          className="shrink-0 flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 border border-red-200 dark:border-red-700 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  // ── Card ────────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Wallet Balance
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefetch}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Refresh balance"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/30">
            <Wallet className="h-5 w-5 text-rose-500" />
          </div>
        </div>
      </div>

      {/* Balance */}
      <div>
        <p className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          {fmt(balance)}
        </p>
      </div>

      {/* Last transaction */}
      {lastTransaction ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {txIcon}
          <span className="truncate max-w-[200px]">
            {lastTransaction.note || "Transaction"}
          </span>
          <span className="shrink-0 font-medium">
            {lastTransaction.type === "CREDIT" ? "+" : "−"}
            {fmt(lastTransaction.amount)}
          </span>
          {lastTransaction.createdAt && (
            <span className="shrink-0 text-slate-400 dark:text-slate-500">
              · {new Date(lastTransaction.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-400 dark:text-slate-500">No transactions yet</p>
      )}

      {/* Top-up trigger / inline form */}
      {!topupOpen ? (
        <button
          onClick={() => setTopupOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          Top Up Wallet
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 p-4">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            Enter Amount
          </p>

          {/* Quick amounts */}
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q}
                onClick={() => setAmount(String(q))}
                className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-colors
                  ${String(q) === amount
                    ? "border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                    : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-700"
                  }`}
              >
                Rs. {q.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">Rs.</span>
              <input
                type="number"
                min="100"
                placeholder="Custom amount"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setAmountError(""); }}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            {amountError && (
              <p className="mt-1 text-xs text-red-500">{amountError}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleTopup}
              disabled={topupLoading}
              className="flex-1 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              {topupLoading ? "Processing…" : "Proceed to Pay"}
            </button>
            <button
              onClick={() => { setTopupOpen(false); setAmount(""); setAmountError(""); }}
              className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}