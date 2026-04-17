import { Bell, CheckCheck } from "lucide-react";
import { TYPE_ICON } from "../../../shared/constants/typeIcon";
import { useNotifications } from "../../../shared/context/NotificationContext";

export default function RiderNotifications() {
  const { notifications, markRead, markAllRead, unreadCount } =
    useNotifications();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Notifications</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-all"
          >
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <Bell size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-600 text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                n.read
                  ? "bg-zinc-900 border-zinc-800 opacity-60"
                  : "bg-zinc-900 border-zinc-700 hover:border-zinc-600"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">
                  {TYPE_ICON[n.type] ?? TYPE_ICON.default}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-zinc-200 font-medium">{n.title}</p>
                  {n.message && (
                    <p className="text-xs text-zinc-500 mt-0.5">{n.message}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-1">
                    {new Date(n.id).toLocaleString()}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-sky-500 mt-1 shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
