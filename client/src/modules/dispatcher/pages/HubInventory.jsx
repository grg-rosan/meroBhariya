import { useState } from "react";
import { Search, RefreshCw, Boxes, Package, Truck, MapPin } from "lucide-react";
import { useHubInventory } from "../hooks/useDispatcher";
import StatusBadge from "../../../components/common/StatusBadge";
import StatCard from "../../../components/common/StatCard";

export default function HubInventory() {
  const { shipments, stats, loading, refetch } = useHubInventory();

  const [search, setSearch]   = useState("");
  const [statusF, setStatusF] = useState("");

  const filtered = shipments.filter(
    (i) =>
      (!search ||
        i.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
        i.merchant?.businessName?.toLowerCase().includes(search.toLowerCase())) &&
      (!statusF || i.status === statusF)
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">
            Balaju hub — inventory
          </h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
            Live count of packages at this hub
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Boxes}
          label="In hub"
          value={stats.inHub ?? 0}
          color="emerald"
        />
        <StatCard
          icon={Package}
          label="Unassigned"
          value={stats.unassigned ?? 0}
          color="red"
        />
        <StatCard
          icon={MapPin}
          label="Assigned"
          value={stats.assigned ?? 0}
          color="amber"
        />
        <StatCard
          icon={Truck}
          label="Out for delivery"
          value={stats.outForDelivery ?? 0}
          color="green"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking or merchant…"
            className="pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-gray-400 dark:focus:border-zinc-600 w-56"
          />
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1">
          {[
            { v: "",                 l: "All"      },
            { v: "IN_HUB",          l: "At hub"   },
            { v: "ASSIGNED",        l: "Assigned" },
            { v: "OUT_FOR_DELIVERY", l: "Out"      },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setStatusF(f.v)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                statusF === f.v
                  ? "bg-emerald-500 text-white"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              {["Tracking #", "Merchant", "Destination", "Vehicle", "Last updated", "Rider", "Status"].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs text-zinc-400 dark:text-zinc-500 font-medium"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-300 dark:text-zinc-600 text-sm">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-300 dark:text-zinc-600 text-sm">
                  No packages match filters
                </td>
              </tr>
            ) : (
              filtered.map((i) => (
                <tr
                  key={i.id}
                  className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {i.trackingNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200">
                    {i.merchant?.businessName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 max-w-35 truncate">
                    {i.deliveryAddress ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded">
                      {i.vehicleType?.name ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400 dark:text-zinc-500">
                    {new Date(i.updatedAt).toLocaleTimeString("en-US", {
                      hour:   "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {i.rider?.user?.fullName ?? (
                      <span className="text-zinc-300 dark:text-zinc-600 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={i.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-xs text-zinc-300 dark:text-zinc-600">
            Showing {filtered.length} of {shipments.length} packages
          </span>
        </div>
      </div>
    </div>
  );
}