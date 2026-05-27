import { ScanLine } from "lucide-react";

export default function ScanInput({ input, onChange, onScan, loading, hasResult }) {
  return (
    <div className={`border-2 border-dashed rounded-xl p-8 text-center mb-4 ${
      hasResult
        ? "border-green-600 bg-green-500/5"
        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
    }`}>
      <div className="w-16 h-16 border-2 border-sky-500/50 rounded-xl mx-auto mb-3 flex items-center justify-center">
        <ScanLine size={28} className="text-sky-500" />
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
        Point camera at package QR code or enter manually
      </p>
      <div className="flex gap-2 justify-center">
        <input
          value={input}
          onChange={onChange}
          onKeyDown={(e) => e.key === "Enter" && onScan()}
          placeholder="PTR-XXXX"
          className="w-40 px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-sky-500"
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