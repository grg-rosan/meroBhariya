import { ScanLine } from "lucide-react";

export default function ScanInput({ input, onChange, onScan, loading, hasResult }) {
  return (
    <div className={`border-2 border-dashed rounded-xl p-8 text-center mb-4 ${
      hasResult
        ? "border-green-600 bg-green-500/5"
        : "border-gray-300 dark:border-zinc-700 bg-white dark:bg-gray-900"
    }`}>
      <div className="w-16 h-16 border-2 border-sky-500/50 rounded-xl mx-auto mb-3 flex items-center justify-center">
        <ScanLine size={28} className="text-sky-500" />
      </div>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">
        Point camera at package QR code or enter manually
      </p>
      <div className="flex gap-2 justify-center">
        <input
          value={input}
          onChange={onChange}
          onKeyDown={(e) => e.key === "Enter" && onScan()}
          placeholder="PTR-XXXX"
          className="w-40 px-3 py-2 text-sm bg-gray-100 dark:bg-blue-950 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-sky-500"
        />
        <button
          onClick={onScan}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all"
        >
          {loading ? "Scanning…" : "Scan"}
        </button>
      </div>
    </div>
  );
}