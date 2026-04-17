// src/admin/pages/AdminOverview.jsx
import { Link } from "react-router-dom";
import { Users, Bike, Package, Wallet } from "lucide-react";
import {
  useOverviewStats,
  useOverviewHealth,
  useOverviewQuickActions,
  useOverviewActivity,
} from "../hooks/useAdmin";
import StatCard from "../../../shared/components/StatCard";

const DOT = {
  success: "bg-green-500",
  info: "bg-sky-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
};

function Bar({ label, pct, color = "bg-violet-500" }) {
  const safePct = pct ?? 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300 font-medium">{safePct}%</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${safePct}%` }}
        />
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    label: "Review pending merchants",
    key: "pendingMerchants",
    to: "/admin/verify",
    color: "text-violet-400",
  },
  {
    label: "Review pending riders",
    key: "pendingRiders",
    to: "/admin/verify",
    color: "text-sky-400",
  },
  {
    label: "Settle pending COD",
    key: null,
    to: "/admin/finance",
    color: "text-amber-400",
  },
  {
    label: "Update fare configs",
    key: null,
    to: "/admin/fleet",
    color: "text-green-400",
  },
  {
    label: "Manage staff",
    key: null,
    to: "/admin/staff",
    color: "text-zinc-400",
  },
];

export default function AdminOverview() {
  const { data: stats, loading: statsLoading } = useOverviewStats();
  const { data: health, loading: healthLoading } = useOverviewHealth();
  const { data: qa, loading: qaLoading } = useOverviewQuickActions();
  const { data: activity, loading: actLoading } = useOverviewActivity();

  const codDisplay =
    stats?.codHeld != null ? `रु ${(stats.codHeld / 100000).toFixed(1)}L` : "—";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Platform overview</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          meroBhariya logistics — live health dashboard
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Users}
          label="Active merchants"
          value={statsLoading ? "…" : (stats?.activeMerchants ?? "—")}
          color="violet"
        />
        <StatCard
          icon={Bike}
          label="Active riders"
          value={statsLoading ? "…" : (stats?.activeRiders ?? "—")}
          color="sky"
        />
        <StatCard
          icon={Package}
          label="Shipments today"
          value={statsLoading ? "…" : (stats?.shipmentsToday ?? "—")}
          color="blue"
        />
        <StatCard
          icon={Wallet}
          label="COD held"
          value={statsLoading ? "…" : codDisplay}
          color="amber"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Platform health */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">
            Platform health
          </h2>
          {healthLoading || qaLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="h-5 bg-zinc-800 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              <Bar
                label="Delivery success rate"
                pct={health?.successRate}
                color="bg-green-500"
              />
              <Bar
                label="Rider availability"
                pct={health?.riderAvailability}
                color="bg-violet-500"
              />
            </>
          )}
          <div className="mt-5 pt-4 border-t border-zinc-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">
                Pending verifications
              </span>
              <div className="flex gap-2">
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
                  {qaLoading ? "…" : (qa?.pendingMerchants ?? 0)} merchants
                </span>
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
                  {qaLoading ? "…" : (qa?.pendingRiders ?? 0)} riders
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Expired documents</span>
              <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded">
                {qaLoading ? "…" : (qa?.expiredDocs ?? 0)} expired
              </span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Quick actions</h2>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-all group"
              >
                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                  {a.label}
                </span>
                {a.key != null && (
                  <span className={`text-xs font-semibold ${a.color}`}>
                    {qaLoading ? "…" : (qa?.[a.key] ?? 0)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">
            Recent activity
          </h2>
          <div className="space-y-3">
            {actLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 bg-zinc-700 shrink-0 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-zinc-800 rounded animate-pulse w-4/5" />
                    <div className="h-2.5 bg-zinc-800 rounded animate-pulse w-1/4" />
                  </div>
                </div>
              ))
            ) : activity?.length ? (
              activity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${DOT[a.type] ?? "bg-zinc-600"}`}
                  />
                  <div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {a.text}
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-600">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
