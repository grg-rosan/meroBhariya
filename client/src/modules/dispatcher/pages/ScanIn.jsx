// src/modules/dispatcher/pages/ScanIn.jsx
import { useState }        from "react";
import { ScanLine }        from "lucide-react";
import { useScanIn }       from "../hooks/useDispatcher";
import { useToast }        from "../../../context/ToastContext";

export default function ScanIn() {
  const { scanIn, loading, result } = useScanIn(); // ← result now comes from hook
  const toast = useToast();

  const [input, setInput] = useState("");
  const [log, setLog]     = useState([]);

  const handleScan = async () => {
    if (!input.trim()) return;
    try {
      const data = await scanIn(input.trim());

      // step=1 means first scan recorded, step=2 means handoff confirmed
      const isConfirmed = data?.step === 2;
      const message     = data?.message ?? `${input.trim()} scanned.`;

      setLog((prev) => [
        {
          id:       input.trim(),
          message,
          time:     new Date().toLocaleTimeString(),
          status:   isConfirmed ? "IN_HUB" : "PENDING_HANDOFF",
          step:     data?.step,
        },
        ...prev,
      ]);

      toast({
        message,
        type: isConfirmed ? "success" : "info",
      });
      setInput("");
    } catch {
      // error toasted by hook
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Scan in to hub</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Two-man rule — two dispatchers must scan the same package to confirm hub handoff
        </p>
      </div>

      {/* Scan area */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-4">
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center mb-4 transition-all ${
            result?.step === 2
              ? "border-green-600 bg-green-500/5"
              : result?.step === 1
                ? "border-amber-600 bg-amber-500/5"
                : "border-zinc-700"
          }`}
        >
          <div className="w-16 h-16 border-2 border-emerald-500/50 rounded-xl mx-auto mb-3 flex items-center justify-center">
            <ScanLine size={28} className="text-emerald-500" />
          </div>

          {result?.step === 1 && (
            <p className="text-sm text-amber-400 mb-3 font-medium">
              ⏳ First scan recorded — waiting for second dispatcher
            </p>
          )}
          {result?.step === 2 && (
            <p className="text-sm text-green-400 mb-3 font-medium">
              ✓ Handoff confirmed — package is now IN_HUB
            </p>
          )}

          <p className="text-sm text-zinc-400 mb-4">Scan QR code or enter tracking number</p>
          <div className="flex gap-2 justify-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              placeholder="MB-XXXXXXXX"
              className="w-48 px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleScan}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all"
            >
              {loading ? "Scanning…" : "Confirm"}
            </button>
          </div>
        </div>
      </div>

      {/* Scan log */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Scanned today</h2>
          <span className="text-xs text-zinc-500">{log.length} scans</span>
        </div>
        {log.length === 0 ? (
          <div className="px-5 py-8 text-center text-zinc-600 text-sm">No scans yet</div>
        ) : (
          log.map((item, i) => (
            <div
              key={`${item.id}-${i}`}
              className="flex items-center gap-4 px-5 py-3 border-b border-zinc-800/50 last:border-none hover:bg-zinc-800/20 transition-colors"
            >
              <span className="font-mono text-xs text-zinc-400 w-32 shrink-0">{item.id}</span>
              <span className="text-xs text-zinc-500 flex-1 truncate">{item.message}</span>
              <span className="text-xs text-zinc-600 w-20 text-right shrink-0">{item.time}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${
                  item.status === "IN_HUB"
                    ? "bg-purple-500/10 text-purple-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {item.status === "IN_HUB" ? "At hub" : "Step 1"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}