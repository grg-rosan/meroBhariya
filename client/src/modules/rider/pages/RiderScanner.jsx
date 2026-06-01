import { useState } from "react";
import { useScanPackage } from "../hooks/useRider";
import { useDeliverPackage } from "../hooks/useDeliverPackage";
import ScanInput from "../components/scanner/ScanInput.jsx";
import ScanResultCard from "../components/scanner/ScanResultCard.jsx";
import ScanFeedback from "../components/scanner/ScanFeedback.jsx";
import ScanHistory from "../components/scanner/ScanHistory.jsx";

const MODES = [
  { key: "PICKUP",       label: "Scan pickup"    },
  { key: "HUB_DISPATCH", label: "Hub dispatch"   },
  { key: "DELIVER",      label: "Confirm delivery" },
];

function formatTime(date) {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function RiderScanner() {
  const { scan, loading: scanLoading, result: scanResult, error: scanError, reset: resetScan } = useScanPackage();
  const shipmentId = scanResult?.id ?? null;
  const { deliver, submitting: deliverLoading, result: deliverResult, geofenceError } = useDeliverPackage(shipmentId);

  const [input,           setInput]           = useState("");
  const [mode,            setMode]            = useState("PICKUP");
  const [codInput,        setCod]             = useState("");
  const [podFile,         setPod]             = useState(null);
  const [deliverSuccess,  setDeliverSuccess]  = useState(false);
  const [pickupSuccess,   setPickupSuccess]   = useState(false);
  const [hubSuccess,      setHubSuccess]      = useState(false);
  const [history,         setHistory]         = useState([]);

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
    setHubSuccess(false);
    setCod("");
    setPod(null);
    resetScan();
  };

  const handleScan = async () => {
    if (!input.trim()) return;
    try {
      const payload = await scan(input.trim(), mode);
      if (!payload) return;

      if (mode === "PICKUP") {
        pushHistory(input.trim(), "Picked up");
        setPickupSuccess(true);
        setInput("");
        resetScan();
      } else if (mode === "HUB_DISPATCH") {
        pushHistory(input.trim(), "Hub dispatched");
        setHubSuccess(true);
        setInput("");
        resetScan();
      } else if (mode === "DELIVER") {
        setCod(payload.codAmount ? String(payload.codAmount) : "");
      }
    } catch (_) {}
  };

  const handleDeliver = async () => {
    if (!shipmentId) return;
    try {
      await deliver({ codCollected: codInput, podNote: null, podFile });
      pushHistory(scanResult?.trackingNumber ?? input, "Delivered", parseFloat(codInput) || null);
      setDeliverSuccess(true);
      setCod("");
      setPod(null);
    } catch (_) {}
  };

  const handleScanAnother = () => {
    setPickupSuccess(false);
    setDeliverSuccess(false);
    setHubSuccess(false);
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
          Scan to accept pickup, dispatch from hub, or confirm delivery
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 mb-4 w-fit">
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleModeSwitch(key)}
            className={`px-4 py-1.5 text-xs rounded-md font-medium transition-all ${
              mode === key
                ? "bg-sky-500 text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ScanInput
        input={input}
        onChange={(e) => { setInput(e.target.value); resetScan(); }}
        onScan={handleScan}
        loading={scanLoading}
        hasResult={!!(scanResult || pickupSuccess || hubSuccess)}
      />

      <ScanFeedback
        pickupSuccess={pickupSuccess}
        hubSuccess={hubSuccess}
        deliverSuccess={deliverSuccess}
        scanError={scanError}
        geofenceError={geofenceError}
        onScanAnother={handleScanAnother}
      />

      {scanResult && !deliverSuccess && !pickupSuccess && !hubSuccess && (
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