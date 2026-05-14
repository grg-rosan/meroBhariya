function ScanHistoryRow({ trackingNumber, action, time, cod }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-zinc-800/50 last:border-none hover:bg-gray-100 dark:hover:bg-blue-950/30">
      <span className="font-mono text-xs text-gray-500 dark:text-zinc-400">{trackingNumber}</span>
      <span className="text-xs text-gray-400 dark:text-zinc-500">
        {action}{cod ? ` · रु ${Number(cod).toLocaleString()}` : ""}
      </span>
      <span className="text-xs text-gray-300 dark:text-zinc-600">{time}</span>
    </div>
  );
}

export default function ScanHistory({ history }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-200 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-white">Recent scans</h2>
      </div>
      {history.length === 0 ? (
        <div className="px-5 py-6 text-xs text-center text-zinc-500">No scans this session.</div>
      ) : (
        history.map((h, i) => <ScanHistoryRow key={i} {...h} />)
      )}
    </div>
  );
}