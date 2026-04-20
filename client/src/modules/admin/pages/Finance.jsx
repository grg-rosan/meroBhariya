// src/admin/pages/Finance.jsx
import { Wallet, AlertTriangle, TrendingUp, Users } from "lucide-react";
import {
  useRevenueSummary,
  usePendingCOD,
  useRiderSettlements,
} from "../hooks/useAdmin";
import StatCard from "../../../shared/components/StatCard";

function SkeletonRow({ cols }) {
  return (
    <tr className="border-b border-zinc-800/50">
      {[...Array(cols)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-zinc-800 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export default function Finance() {
  const { data: summary, loading: summaryLoading } = useRevenueSummary();
  const { data: codData, loading: codLoading } = usePendingCOD();
  const { data: riders, loading: ridersLoading } = useRiderSettlements();

  const s = summary ?? {};
  const codDisplay = (val) =>
    val != null ? `रु ${(val / 100000).toFixed(1)}L` : "—";

  // backend shapes:
  // /finance/revenue     → { totalCOD, heldByRiders, owedToMerchants, platformRevenue }
  // /finance/cod/pending → { transactions: [{ id, rider, merchant, amount, ... }] }
  // /settlements/riders  → { riders: [{ id, fullName, vehicleType, codHeld, lastDrop }] }
  const transactions = codData?.transactions ?? [];
  const riderList = riders?.riders ?? [];

  const totalCOD = s.totalCOD ?? 0;
  const heldByRiders = s.heldByRiders ?? 0;
  const owedToMerchants = s.owedToMerchants ?? 0;
  const platformRevenue = s.platformRevenue ?? 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Finance summary</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          COD held vs. owed to merchants — live snapshot
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Wallet}
          label="Total COD collected"
          value={summaryLoading ? "…" : codDisplay(totalCOD)}
          color="violet"
        />
        <StatCard
          icon={AlertTriangle}
          label="Held by riders"
          value={summaryLoading ? "…" : codDisplay(heldByRiders)}
          color="red"
        />
        <StatCard
          icon={Users}
          label="Owed to merchants"
          value={summaryLoading ? "…" : codDisplay(owedToMerchants)}
          color="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="Platform revenue"
          value={summaryLoading ? "…" : codDisplay(platformRevenue)}
          color="green"
        />
      </div>

      {/* Cash flow bar */}
      {!summaryLoading && totalCOD > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-medium text-white mb-3">
            Cash flow breakdown
          </h2>
          <div className="h-5 bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-red-500/70 transition-all"
              style={{ width: `${(heldByRiders / totalCOD) * 100}%` }}
            />
            <div
              className="h-full bg-amber-500/70 transition-all"
              style={{ width: `${(owedToMerchants / totalCOD) * 100}%` }}
            />
            <div
              className="h-full bg-violet-500/70 transition-all"
              style={{ width: `${(platformRevenue / totalCOD) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500/70 inline-block" />
              Riders
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/70 inline-block" />
              Merchants
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-500/70 inline-block" />
              Platform
            </span>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Cash held per rider */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">
              Cash held by riders
            </h2>
            <span className="text-xs text-red-400">
              रु {heldByRiders.toLocaleString()} total
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Rider", "Vehicle", "COD held", "Last drop"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ridersLoading ? (
                [...Array(4)].map((_, i) => <SkeletonRow key={i} cols={4} />)
              ) : riderList.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-zinc-600 text-xs"
                  >
                    No riders holding COD
                  </td>
                </tr>
              ) : (
                riderList.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3 text-sm text-zinc-200 font-medium">
                      {r.fullName ?? r.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {r.vehicleType}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-red-400">
                      रु {(r.codHeld ?? r.held ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {r.lastDrop ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pending COD transactions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">
              Pending COD transactions
            </h2>
            <span className="text-xs text-amber-400">
              रु {owedToMerchants.toLocaleString()} owed
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Tracking #", "Merchant", "Amount", "Rider"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codLoading ? (
                [...Array(4)].map((_, i) => <SkeletonRow key={i} cols={4} />)
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-zinc-600 text-xs"
                  >
                    No pending COD transactions
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3 text-xs text-zinc-400 font-mono">
                      {t.trackingNumber ?? t.shipment?.trackingNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-200 font-medium">
                      {t.merchantName ?? t.merchant?.businessName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-amber-400">
                      रु {(t.codAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {t.riderName ?? t.rider?.user?.fullName ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
