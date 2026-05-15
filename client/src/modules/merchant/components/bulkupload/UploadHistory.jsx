
// src/modules/merchant/components/bulk/UploadHistory.jsx

// TODO: replace with real data from useShipment or a dedicated hook
const HISTORY = [
  { date: "14 Apr 2025", filename: "orders-apr14.csv",   total: 52, processed: 49, errors: 3 },
  { date: "10 Apr 2025", filename: "orders-apr10.xlsx",  total: 38, processed: 38, errors: 0 },
  { date: "7 Apr 2025",  filename: "weekly-batch.csv",   total: 64, processed: 60, errors: 4 },
];

const HEADERS = ["Date", "File", "Total", "Processed", "Errors"];

export default function UploadHistory() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-white">Upload history</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="text-left px-4 py-2.5 text-xs text-zinc-400 dark:text-zinc-500 font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HISTORY.map((h) => (
            <tr
              key={h.date}
              className="border-b border-zinc-200/50 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-blue-950/30"
            >
              <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{h.date}</td>
              <td className="px-4 py-3 text-xs font-mono text-zinc-700 dark:text-zinc-300">{h.filename}</td>
              <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">{h.total}</td>
              <td className="px-4 py-3 text-xs text-green-400">{h.processed}</td>
              <td className="px-4 py-3 text-xs text-rose-400">{h.errors || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}