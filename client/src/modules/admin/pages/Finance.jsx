// src/admin/pages/Finance.jsx
import { Wallet, AlertTriangle, TrendingUp, Users } from "lucide-react";
import {
  useRevenueSummary,
  usePendingCOD,
  useRiderSettlements,
} from "../hooks/useAdmin";
import StatCard from "../../../components/common/StatCard";

function SkeletonRow({ cols }) {
  return (
    <tr className="border-b border-gray-200/50 dark:border-zinc-800/50">
      {[...Array(cols)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-gray-100 dark:bg-blue-950 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export default function Finance() {
  const { data: summary, loading: summaryLoading } = useRevenueSummary();
  const { data: codData,  loading: codLoading     } = usePendingCOD();
  const { data: riderData, loading: ridersLoading } = useRiderSettlements();

  const s = summary ?? {};

  // ── Map backend fields correctly ──────────────────────────────────────────
  // backend returns: totalFareRevenue, totalCodCollected, totalShipments,
  //                  totalTransactions, totalRiderEarnings
  const totalCOD        = s.totalCodCollected  ?? 0;
  const platformRevenue = s.totalFareRevenue   ?? 0;
  const riderEarnings   = s.totalRiderEarnings ?? 0;
  const totalShipments  = s.totalShipments     ?? 0;

  // ── COD data from /finance/cod/pending ────────────────────────────────────
  // backend: { transactions: [{ id, shipmentId, codAmount, shipment: { trackingNumber, merchant, rider } }] }
  const transactions = codData?.transactions ?? [];
  const totalHeld    = codData?.totalHeld    ?? 0;

  // ── Rider settlements from /settlements/riders ────────────────────────────
  // backend: { riders: [{ id, fullName, vehicleType, codHeld, txCount, lastDrop }], totalHeld }
  const riderList        = riderData?.riders    ?? [];
  const ridersHoldingCOD = riderData?.totalHeld ?? 0;

  const codDisplay = (val) =>
    val != null ? `रु ${Number(val).toLocaleString()}` : "—";

  // Cash flow bar — only show if we have real values
  const barTotal = totalCOD + platformRevenue + riderEarnings;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Finance summary</h1>
        <p className="text-sm text-gray-400 dark:text-zinc-500 mt-0.5">
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
          value={ridersLoading ? "…" : codDisplay(ridersHoldingCOD)}
          color="red"
        />
        <StatCard
          icon={Users}
          label="Total shipments"
          value={summaryLoading ? "…" : totalShipments.toLocaleString()}
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
      {!summaryLoading && barTotal > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-medium text-white mb-3">
            Cash flow breakdown
          </h2>
          <div className="h-5 bg-gray-100 dark:bg-blue-950 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-red-500/70 transition-all"
              style={{ width: `${(ridersHoldingCOD / barTotal) * 100}%` }}
            />
            <div
              className="h-full bg-amber-500/70 transition-all"
              style={{ width: `${(totalCOD / barTotal) * 100}%` }}
            />
            <div
              className="h-full bg-violet-500/70 transition-all"
              style={{ width: `${(platformRevenue / barTotal) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500/70 inline-block" />
              Riders holding
            </span>
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/70 inline-block" />
              COD collected
            </span>
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-500/70 inline-block" />
              Platform revenue
            </span>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Cash held per rider */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">
              Cash held by riders
            </h2>
            <span className="text-xs text-red-400">
              रु {ridersHoldingCOD.toLocaleString()} total
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800">
                {["Rider", "Vehicle", "COD held", "Last drop"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-xs text-gray-400 dark:text-zinc-500 font-medium"
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
                    className="px-4 py-8 text-center text-gray-300 dark:text-zinc-600 text-xs"
                  >
                    No riders holding COD
                  </td>
                </tr>
              ) : (
                riderList.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-200/50 dark:border-zinc-800/50 hover:bg-gray-100 dark:hover:bg-blue-950/30"
                  >
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-zinc-200 font-medium">
                      {r.fullName}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 dark:text-zinc-500">
                      {r.vehicleType}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-red-400">
                      रु {Number(r.codHeld ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 dark:text-zinc-500">
                      {r.lastDrop ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pending COD transactions */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">
              Pending COD transactions
            </h2>
            <span className="text-xs text-amber-400">
              रु {Number(totalHeld).toLocaleString()} held
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800">
                {["Tracking #", "Merchant", "Amount", "Rider"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-xs text-gray-400 dark:text-zinc-500 font-medium"
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
                    className="px-4 py-8 text-center text-gray-300 dark:text-zinc-600 text-xs"
                  >
                    No pending COD transactions
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-200/50 dark:border-zinc-800/50 hover:bg-gray-100 dark:hover:bg-blue-950/30"
                  >
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-zinc-400 font-mono">
                      {t.shipment?.trackingNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 dark:text-zinc-200 font-medium">
                      {t.shipment?.merchant?.businessName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-amber-400">
                      रु {Number(t.codAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 dark:text-zinc-500">
                      {t.shipment?.rider?.user?.fullName ?? "—"}
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