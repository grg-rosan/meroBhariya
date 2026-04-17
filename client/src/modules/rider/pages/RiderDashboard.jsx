import { useState } from "react";
import { Package, MapPin, Banknote, TrendingUp } from "lucide-react";
import { useRiderDashboard, useToggleDuty } from "../hooks/useRider";
import { useSocket } from "../../../shared/hooks/useSocket";
import { useNotifications } from "../../../shared/context/NotificationContext";
import { useAuth } from "../../auth/AuthContext";
import StatCard from "../../../shared/components/StatCard";

export default function RiderDashboard() {
  const { user, refreshUser } = useAuth();
  const { data, loading, error, refetch } = useRiderDashboard();
  const { toggle, loading: tl } = useToggleDuty();
  const { push } = useNotifications();
  const [onlineOverride, setOnlineOverride] = useState(null);
  const [banner, setBanner] = useState(null);

  useSocket(user?.id, (event, socketData) => {
    // ← renamed data→socketData to avoid shadowing
    if (event === "verified") {
      const n = {
        type: "verified",
        title: "Account verified!",
        message: "You can now go on duty.",
      };
      push(n);
      setBanner(n);
      refetch();
      refreshUser(); // ← refresh auth context too
    }
    if (event === "doc_approved") {
      push({
        type: "doc_approved",
        title: "Document approved",
        message: `Your ${socketData?.docType} was approved.`,
      });
    }
    if (event === "doc_rejected") {
      push({
        type: "doc_rejected",
        title: "Document rejected",
        message: `Your ${socketData?.docType} was rejected. ${socketData?.note ?? ""}`,
      });
    }
  });

  // ← use isVerified from both sources
  const isVerified =
    data?.rider?.isVerified ?? user?.riderProfile?.isVerified ?? false;
  const online = onlineOverride ?? data?.rider?.isOnline ?? false;

  const handleToggle = async () => {
    const next = !online;
    setOnlineOverride(next);
    try {
      await toggle(next);
    } catch (_) {
      setOnlineOverride(!next);
    }
  };

  if (loading) return <div className="p-6 text-zinc-400">Loading...</div>;
  if (error)
    return <div className="p-6 text-red-400">Failed to load dashboard.</div>;

  const rider = data?.rider ?? {};
  const stats = data?.stats ?? {};
  const activity = data?.activity ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {banner && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-700 rounded-xl text-green-400 text-sm flex items-center justify-between">
          <span>🎉 {banner.message}</span>
          <button
            onClick={() => setBanner(null)}
            className="text-green-600 hover:text-green-400 ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* ← use isVerified not rider.isVerified */}
      {!isVerified && (
        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-700 rounded-xl text-amber-400 text-sm">
          ⏳ Your documents are under review. You'll be notified once verified.
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">My shift</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {rider.fullName} · {rider.vehicleType} · {rider.vehicleNumber}
          </p>
        </div>
        {/* ← use isVerified not rider.isVerified */}
        <button
          onClick={handleToggle}
          disabled={tl || !isVerified}
          className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${online ? "border-green-600 bg-green-500/10" : "border-zinc-700 bg-zinc-900"} ${!isVerified ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <div
            className={`relative w-9 h-5 rounded-full transition-colors ${online ? "bg-green-500" : "bg-zinc-700"}`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${online ? "left-[18px]" : "left-0.5"}`}
            />
          </div>
          <span
            className={`text-sm font-medium ${online ? "text-green-400" : "text-zinc-500"}`}
          >
            {online ? "On duty" : "Off duty"}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Package}
          label="Deliveries today"
          value={stats.deliveriesToday ?? 0}
          color="sky"
        />
        <StatCard
          icon={Banknote}
          label="COD collected"
          value={`रु ${(stats.codCollected ?? 0).toLocaleString()}`}
          color="green"
        />
        <StatCard
          icon={MapPin}
          label="Km covered"
          value={stats.kmCovered ? `${stats.kmCovered} km` : "—"}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Today's earnings"
          value={`रु ${(stats.todayEarnings ?? 0).toLocaleString()}`}
          color="amber"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-white mb-4">
          Today's activity
        </h2>
        {activity.length === 0 ? (
          <p className="text-sm text-zinc-600">No activity yet today.</p>
        ) : (
          <div className="relative pl-5">
            {activity.map((item, i) => (
              <div key={item.id} className="relative pb-4 last:pb-0">
                <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-sky-500 border-2 border-zinc-900 z-10" />
                {i < activity.length - 1 && (
                  <div className="absolute -left-[15px] top-3 w-px h-full bg-zinc-800" />
                )}
                <p className="text-sm text-zinc-300">
                  {item.status} — {item.receiverName} · {item.deliveryAddress}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  {new Date(item.time).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
