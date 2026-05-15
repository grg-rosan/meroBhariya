// src/modules/dispatcher/pages/ScanIn.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { ScanLine, Camera, Keyboard } from "lucide-react";
import { useScanToHub } from "../hooks/useDispatcher";

export default function ScanIn() {
  const { scan, loading, result, error, reset } = useScanToHub();

  const [input, setInput] = useState("");
  const [log, setLog] = useState([]);
  const [mode, setMode] = useState("manual");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // ── Scan handler ──────────────────────────────────────────────────────────

  const handleScan = useCallback(
    async (value) => {
      const tracking = (value ?? input).trim().toUpperCase();
      if (!tracking) return;

      try {
        const data = await scan(tracking);
        setLog((prev) => [
          {
            tracking,
            receiver: data?.data?.receiverName ?? "—",
            address: data?.data?.deliveryAddress ?? "—",
            time: new Date().toLocaleTimeString(),
            success: true,
          },
          ...prev,
        ]);
      } catch (e) {
        setLog((prev) => [
          {
            tracking,
            receiver: e.message,
            address: "—",
            time: new Date().toLocaleTimeString(),
            success: false,
          },
          ...prev,
        ]);
      }

      setInput("");
    },
    [input, scan],
  );

  // ── Camera QR scanning ────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (mode !== "camera") {
      stopCamera();
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        if (!("BarcodeDetector" in window)) {
          setMode("manual");
          return;
        }

        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

        const tick = async () => {
          if (cancelled) return;
          if (!videoRef.current || videoRef.current.readyState < 2) {
            requestAnimationFrame(tick);
            return;
          }
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              stopCamera();
              setMode("manual");
              handleScan(codes[0].rawValue);
            } else {
              requestAnimationFrame(tick);
            }
          } catch {
            requestAnimationFrame(tick);
          }
        };

        requestAnimationFrame(tick);
      } catch {
        setMode("manual");
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [mode, handleScan, stopCamera]);

  // ── Auto-clear result/error after 4s ─────────────────────────────────────

  useEffect(() => {
    if (!result && !error) return;
    const t = setTimeout(reset, 4000);
    return () => clearTimeout(t);
  }, [result, error, reset]);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Scan into hub</h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
          Scan the QR code on the package label — marks shipment as IN HUB
          instantly.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("manual")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === "manual"
              ? "bg-zinc-200 dark:bg-blue-900 text-white"
              : "text-zinc-400  hover:text-zinc-700 dark:text-zinc-300"
          }`}
        >
          <Keyboard size={12} /> Manual
        </button>
        <button
          onClick={() => setMode("camera")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === "camera"
              ? "bg-zinc-200 dark:bg-blue-900 text-white"
              : "text-zinc-400  hover:text-zinc-700 dark:text-zinc-300"
          }`}
        >
          <Camera size={12} /> Camera
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 mb-4">
        {/* Camera view */}
        {mode === "camera" && (
          <div className="mb-4 rounded-xl overflow-hidden relative">
            <video
              ref={videoRef}
              className="w-full h-56 object-cover"
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-40 border-2 border-emerald-400 rounded-xl opacity-70" />
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2">
              Point at QR code on package
            </p>
          </div>
        )}

        {/* Scan area */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            result
              ? "border-emerald-600 bg-emerald-500/5"
              : error
                ? "border-red-600 bg-red-500/5"
                : "border-zinc-300 dark:border-zinc-700"
          }`}
        >
          <div className="w-14 h-14 border-2 border-emerald-500/50 rounded-xl mx-auto mb-3 flex items-center justify-center">
            <ScanLine size={24} className="text-emerald-500" />
          </div>

          {result && (
            <p className="text-sm text-emerald-400 mb-3 font-medium">
              ✓ {result.trackingNumber} marked IN HUB
            </p>
          )}
          {error && (
            <p className="text-sm text-red-400 mb-3 font-medium">✗ {error}</p>
          )}
          {!result && !error && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-4">
              Scan QR or enter tracking number
            </p>
          )}

          {mode === "manual" && (
            <div className="flex gap-2 justify-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                placeholder="PTR-XXXXXXXX"
                className="w-48 px-3 py-2 text-sm bg-zinc-100 dark:bg-blue-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleScan()}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all"
              >
                {loading ? "Scanning…" : "Scan"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scan log */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Scanned today</h2>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {log.length} scans
          </span>
        </div>

        {log.length === 0 ? (
          <div className="px-5 py-8 text-center text-zinc-300 dark:text-zinc-600 text-sm">
            No scans yet
          </div>
        ) : (
          log.map((item, i) => (
            <div
              key={`${item.tracking}-${i}`}
              className="flex items-center gap-4 px-5 py-3 border-b border-zinc-200/50 dark:border-zinc-800/50 last:border-none hover:bg-zinc-100 dark:bg-blue-950/20 transition-colors"
            >
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 w-32 shrink-0">
                {item.tracking}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-1 truncate">
                {item.receiver}
              </span>
              <span className="text-xs text-zinc-300 dark:text-zinc-600 w-20 text-right shrink-0">
                {item.time}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${
                  item.success
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {item.success ? "IN HUB" : "Failed"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
