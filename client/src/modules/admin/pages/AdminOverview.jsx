import { Users, Bike, Package, Wallet } from "lucide-react";
import {
  useOverviewStats,
  useOverviewHealth,
  useOverviewQuickActions,
  useOverviewActivity,
} from "../hooks/useAdmin";
import StatCard from "../../../components/common/StatCard";
import PlatformHealth from "../components/overview/PlatformHealth";
import QuickActions from "../components/overview/QuickAction";
import ActivityFeed from "../components/overview/ActivityFeed";

export default function AdminOverview() {
  const { data: stats, loading: statsLoading } = useOverviewStats();
  const { data: health, loading: healthLoading } = useOverviewHealth();
  const { data: qa, loading: qaLoading } = useOverviewQuickActions();
  const { data: activity, loading: actLoading } = useOverviewActivity();

  const codDisplay =
    stats?.codHeld != null ? `रु ${(stats.codHeld / 100000).toFixed(1)}L` : "—";

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Platform overview</h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
          meroBhariya logistics — live health dashboard
        </p>
      </div>

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
        <PlatformHealth
          health={health}
          qa={qa}
          loading={healthLoading || qaLoading}
        />
        <QuickActions qa={qa} loading={qaLoading} />
        <ActivityFeed activity={activity} loading={actLoading} />
      </div>
    </div>
  );
}
