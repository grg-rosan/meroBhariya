const DOT = {
  success: "bg-green-500",
  info:    "bg-sky-500",
  warning: "bg-amber-500",
  error:   "bg-red-500",
};

export default function ActivityFeed({ activity, loading }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
      <h2 className="text-sm font-medium text-white mb-4">Recent activity</h2>
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-2 h-2 rounded-full mt-1.5 bg-gray-200 dark:bg-blue-900 shrink-0 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-100 dark:bg-blue-950 rounded animate-pulse w-4/5" />
                <div className="h-2.5 bg-gray-100 dark:bg-blue-950 rounded animate-pulse w-1/4" />
              </div>
            </div>
          ))
        ) : activity?.length ? (
          activity.map((a, i) => (
            <div key={i} className="flex gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${DOT[a.type] ?? "bg-gray-300 dark:bg-zinc-600"}`} />
              <div>
                <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">{a.text}</p>
                <p className="text-xs text-gray-300 dark:text-zinc-600 mt-0.5">{a.time}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-300 dark:text-zinc-600">No recent activity</p>
        )}
      </div>
    </div>
  );
}