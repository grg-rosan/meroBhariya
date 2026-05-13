import { useState } from "react";
import { ScanLine, CheckCircle, XCircle, Camera } from "lucide-react";
import { useScanPackage, useConfirmDelivery } from "../hooks/useRider";

const SCAN_HISTORY = [
  { id: "PTR-2832", action: "Delivered", time: "10:41 AM", cod: "रु 2,400" },
  { id: "PTR-2831", action: "Delivered", time: "10:02 AM", cod: null },
  { id: "PTR-2830", action: "Picked up", time: "9:14 AM", cod: null },
];

export default function RiderScanner() {
  const {
    scan,
    loading: scanLoading,
    result: scanResult,
    error: scanError,
    reset: resetScan,
  } = useScanPackage();
  const { deliver, loading: deliverLoading } = useConfirmDelivery();

  const [input, setInput] = useState("");
  const [mode, setMode] = useState("PICKUP"); // PICKUP | DELIVER
  const [codInput, setCod] = useState("");
  const [podFile, setPod] = useState(null);
  const [success, setSuccess] = useState(false);
  const [pickupSuccess, setPickupSuccess] = useState(false);

  const handleScan = async () => {
    if (!input.trim()) return;
    try {
      const payload = await scan(input.trim(), mode);
      if (mode === "PICKUP" && payload) {
        setPickupSuccess(true);
        setInput("");
        resetScan();
      }
    } catch (_) {}
  };

  const handleDeliver = async () => {
    if (!scanResult?.id) return;
    try {
      await deliver(scanResult.id, {
        codCollected: parseFloat(codInput) || 0,
        podFile,
      });
      setSuccess(true);
    } catch (_) {}
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Scanner</h1>
        <p className="text-sm text-gray-400 dark:text-zinc-500 mt-0.5">
          Scan to accept pickup or confirm delivery
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-1 mb-4 w-fit">
        {["PICKUP", "DELIVER"].map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setSuccess(false);
              setPickupSuccess(false);
              resetScan();
            }}
            className={`px-4 py-1.5 text-xs rounded-md font-medium transition-all ${mode === m ? "bg-sky-500 text-white" : "text-gray-500  hover:text-gray-800 dark:text-zinc-200"}`}
          >
            {m === "PICKUP" ? "Scan pickup" : "Confirm delivery"}
          </button>
        ))}
      </div>

      {/* Scan box */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center mb-4 ${
          scanResult || pickupSuccess
            ? "border-green-600 bg-green-500/5"
            : "border-gray-300 dark:border-zinc-700 bg-white dark:bg-gray-900"
        }`}
      >
        <div className="w-16 h-16 border-2 border-sky-500/50 rounded-xl mx-auto mb-3 flex items-center justify-center">
          <ScanLine size={28} className="text-sky-500" />
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">
          Point camera at package QR code or enter manually
        </p>
        <div className="flex gap-2 justify-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder="PTR-XXXX"
            className="w-40 px-3 py-2 text-sm bg-gray-100 dark:bg-blue-950 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={handleScan}
            disabled={scanLoading || !input.trim()}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all"
          >
            {scanLoading ? "Scanning…" : "Scan"}
          </button>
        </div>
      </div>

      {pickupSuccess && !success && (
        <div className="bg-green-500/10 border border-green-700/50 rounded-xl p-4 mb-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400 shrink-0" />
            <span className="text-sm text-green-300 font-medium">
              Pickup recorded — take parcel to the hub for dispatcher scan.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPickupSuccess(false)}
            className="text-xs text-sky-400 hover:underline self-start"
          >
            Scan another package
          </button>
        </div>
      )}

      {/* Scan result */}
      {scanResult && !success && !pickupSuccess && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={15} className="text-green-400" />
            <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">
              {scanResult.trackingNumber ?? input} — found
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-4">
            <div>
              <span className="text-gray-300 dark:text-zinc-600">
                Receiver:{" "}
              </span>
              {scanResult.receiverName ?? "Sita Rai"}
            </div>
            <div>
              <span className="text-gray-300 dark:text-zinc-600">
                Address:{" "}
              </span>
              {scanResult.deliveryAddress ?? "Patan-7"}
            </div>
            <div>
              <span className="text-gray-300 dark:text-zinc-600">Weight: </span>
              {scanResult.weight ?? "0.5"} kg
            </div>
            <div>
              <span className="text-gray-300 dark:text-zinc-600">COD: </span>
              {scanResult.codAmount ? `रु ${scanResult.codAmount}` : "—"}
            </div>
          </div>
          {mode === "DELIVER" && (
            <div className="border-t border-gray-200 dark:border-zinc-800 pt-3 space-y-3">
              <div>
                <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">
                  COD collected (रु)
                </label>
                <input
                  type="number"
                  value={codInput}
                  onChange={(e) => setCod(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-blue-950 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">
                  Proof of delivery (photo)
                </label>
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-gray-500 dark:hover:border-zinc-500 transition-all">
                  <Camera
                    size={14}
                    className="text-gray-400 dark:text-zinc-500"
                  />
                  <span className="text-xs text-gray-400 dark:text-zinc-500">
                    {podFile ? podFile.name : "Upload photo or signature"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPod(e.target.files[0])}
                  />
                </label>
              </div>
              <button
                onClick={handleDeliver}
                disabled={deliverLoading}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all"
              >
                {deliverLoading ? "Confirming…" : "Confirm delivery"}
              </button>
            </div>
          )}
          {mode === "PICKUP" && (
            <p className="text-xs text-zinc-500 text-center">
              Tap <span className="text-zinc-300 font-medium">Scan</span> above to confirm pickup and update status.
            </p>
          )}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-700/50 rounded-xl p-4 mb-4 flex items-center gap-2">
          <CheckCircle size={16} className="text-green-400" />
          <span className="text-sm text-green-300 font-medium">
            Delivery confirmed successfully!
          </span>
        </div>
      )}

      {scanError && (
        <div className="bg-red-500/10 border border-red-700/50 rounded-xl p-4 mb-4 flex items-center gap-2">
          <XCircle size={15} className="text-red-400" />
          <span className="text-sm text-red-300">{scanError}</span>
        </div>
      )}

      {/* Scan history */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-white">Recent scans</h2>
        </div>
        {SCAN_HISTORY.map((h) => (
          <div
            key={h.id}
            className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-zinc-800/50 last:border-none hover:bg-gray-100 dark:bg-blue-950/30"
          >
            <span className="font-mono text-xs text-gray-500 dark:text-zinc-400">
              {h.id}
            </span>
            <span className="text-xs text-gray-400 dark:text-zinc-500">
              {h.action}
              {h.cod ? ` · ${h.cod}` : ""}
            </span>
            <span className="text-xs text-gray-300 dark:text-zinc-600">
              {h.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
