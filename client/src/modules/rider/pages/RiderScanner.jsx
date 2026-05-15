import { useState } from "react";
import { useScanPackage } from "../hooks/useRider";
import { useDeliverPackage } from "../hooks/useDeliverPackage";
import ScanInput from "../components/scanner/ScanInput.jsx";
import ScanResultCard from "../components/scanner/ScanResultCard.jsx";
import ScanFeedback from "../components/scanner/ScanFeedback.jsx";
import ScanHistory from "../components/scanner/ScanHistory.jsx";

function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RiderScanner() {
  const {
    scan,
    loading: scanLoading,
    result: scanResult,
    error: scanError,
    reset: resetScan,
  } = useScanPackage();
  const shipmentId = scanResult?.id ?? null;
  const {
    deliver,
    submitting: deliverLoading,
    result: deliverResult,
    geofenceError,
  } = useDeliverPackage(shipmentId);

  const [input, setInput] = useState("");
  const [mode, setMode] = useState("PICKUP");
  const [codInput, setCod] = useState("");
  const [podFile, setPod] = useState(null);
  const [deliverSuccess, setDeliverSuccess] = useState(false);
  const [pickupSuccess, setPickupSuccess] = useState(false);
  const [history, setHistory] = useState([]);

  function pushHistory(trackingNumber, action, cod = null) {
    setHistory((prev) => [
      { trackingNumber, action, time: formatTime(new Date()), cod },
      ...prev.slice(0, 19),
    ]);
  }

  const handleModeSwitch = (m) => {
    setMode(m);
    setDeliverSuccess(false);
    setPickupSuccess(false);
    setCod("");
    setPod(null);
    resetScan();
  };

  const handleScan = async () => {
    if (!input.trim()) return;
    try {
      const payload = await scan(input.trim(), mode);
      if (mode === "PICKUP" && payload) {
        pushHistory(input.trim(), "Picked up");
        setPickupSuccess(true);
        setInput("");
        resetScan();
      } else if (mode === "DELIVER" && payload) {
        // Pre-fill COD from scan result at the call site — no effect needed
        setCod(payload.codAmount ? String(payload.codAmount) : "");
      }
    } catch (_) {}
  };

  const handleDeliver = async () => {
    if (!shipmentId) return;
    try {
      await deliver({ codCollected: codInput, podNote: null, podFile });
      // deliverResult state lives in useDeliverPackage — read it after await
      // by checking the hook's result directly after the call resolves
      pushHistory(
        scanResult?.trackingNumber ?? input,
        "Delivered",
        parseFloat(codInput) || null,
      );
      setDeliverSuccess(true);
      setCod("");
      setPod(null);
    } catch (_) {
      // toast is already handled inside useDeliverPackage
    }
  };

  const handleScanAnother = () => {
    setPickupSuccess(false);
    setDeliverSuccess(false);
    resetScan();
    setInput("");
    setCod("");
    setPod(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Scanner</h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
          Scan to accept pickup or confirm delivery
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 mb-4 w-fit">
        {["PICKUP", "DELIVER"].map((m) => (
          <button
            key={m}
            onClick={() => handleModeSwitch(m)}
            className={`px-4 py-1.5 text-xs rounded-md font-medium transition-all ${
              mode === m
                ? "bg-sky-500 text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-200"
            }`}
          >
            {m === "PICKUP" ? "Scan pickup" : "Confirm delivery"}
          </button>
        ))}
      </div>

      <ScanInput
        input={input}
        onChange={(e) => {
          setInput(e.target.value);
          resetScan();
        }}
        onScan={handleScan}
        loading={scanLoading}
        hasResult={!!(scanResult || pickupSuccess)}
      />

      <ScanFeedback
        pickupSuccess={pickupSuccess}
        deliverSuccess={deliverSuccess}
        scanError={scanError}
        geofenceError={geofenceError}
        onScanAnother={handleScanAnother}
      />

      {scanResult && !deliverSuccess && !pickupSuccess && (
        <ScanResultCard
          shipment={scanResult}
          mode={mode}
          codInput={codInput}
          onCodChange={(e) => setCod(e.target.value)}
          podFile={podFile}
          onPodChange={(e) => setPod(e.target.files[0])}
          onDeliver={handleDeliver}
          delivering={deliverLoading}
        />
      )}

      <ScanHistory history={history} />
    </div>
  );
}
