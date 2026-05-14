// src/modules/merchant/components/shipment/components/Timeline.jsx

/**
 * @param {{ logs: Array<{ id, status, createdAt, note? }> }} props
 */
export default function Timeline({ logs }) {
  if (!logs?.length) return null;

  return (
    <div className="mt-3 space-y-1.5">
      {logs.map((log, i) => (
        <div key={log.id} className="flex items-start gap-2">
          <div className="flex flex-col items-center">
            <div
              className={
                "w-2 h-2 rounded-full mt-1 " +
                (i === logs.length - 1
                  ? "bg-rose-400"
                  : "bg-gray-300 dark:bg-zinc-600")
              }
            />
            {i < logs.length - 1 && (
              <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700" />
            )}
          </div>
          <div>
            <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">
              {log.status.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-gray-400 dark:text-zinc-500 ml-2">
              {new Date(log.createdAt).toLocaleString()}
            </span>
            {log.note && (
              <p className="text-xs text-gray-400 dark:text-zinc-500">{log.note}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}