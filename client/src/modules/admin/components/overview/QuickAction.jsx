import { Link } from "react-router-dom";

const QUICK_ACTIONS = [
  { label: "Review pending merchants", key: "pendingMerchants", to: "/admin/verify",  color: "text-violet-400" },
  { label: "Review pending riders",    key: "pendingRiders",    to: "/admin/verify",  color: "text-sky-400"    },
  { label: "Settle pending COD",       key: null,               to: "/admin/finance", color: "text-amber-400"  },
  { label: "Update fare configs",      key: null,               to: "/admin/fleet",   color: "text-green-400"  },
  { label: "Manage staff",             key: null,               to: "/admin/staff",   color: "text-gray-500 dark:text-zinc-400" },
];

export default function QuickActions({ qa, loading }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
      <h2 className="text-sm font-medium text-white mb-4">Quick actions</h2>
      <div className="space-y-2">
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="flex items-center justify-between p-3 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-100 dark:bg-blue-950 transition-all group"
          >
            <span className="text-sm text-gray-700 dark:text-zinc-300 group-hover:text-white transition-colors">
              {a.label}
            </span>
            {a.key != null && (
              <span className={`text-xs font-semibold ${a.color}`}>
                {loading ? "…" : (qa?.[a.key] ?? 0)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}