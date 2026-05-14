import { Bar } from "../../../../shared/ui/porter-ui";

export default function PlatformHealth({ health, qa, loading }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
      <h2 className="text-sm font-medium text-white mb-4">Platform health</h2>

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-5 bg-gray-100 dark:bg-blue-950 rounded animate-pulse"
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

      <div className="mt-5 pt-4 border-t border-gray-200 dark:border-zinc-800 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            Pending verifications
          </span>
          <div className="flex gap-2">
            <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
              {loading ? "…" : (qa?.pendingMerchants ?? 0)} merchants
            </span>
            <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
              {loading ? "…" : (qa?.pendingRiders ?? 0)} riders
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            Expired documents
          </span>
          <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded">
            {loading ? "…" : (qa?.expiredDocs ?? 0)} expired
          </span>
        </div>
      </div>
    </div>
  );
}
