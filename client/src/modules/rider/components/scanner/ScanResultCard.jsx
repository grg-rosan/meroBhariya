import { CheckCircle, Camera } from "lucide-react";

export default function ScanResultCard({
  shipment,        // scanResult object
  mode,            // "PICKUP" | "DELIVER"
  codInput,
  onCodChange,
  podFile,
  onPodChange,
  onDeliver,
  delivering,
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle size={15} className="text-green-400" />
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {shipment.trackingNumber} — found
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        <div><span className="text-zinc-300 dark:text-zinc-600">Receiver: </span>{shipment.receiverName}</div>
        <div><span className="text-zinc-300 dark:text-zinc-600">Address: </span>{shipment.deliveryAddress}</div>
        <div><span className="text-zinc-300 dark:text-zinc-600">Weight: </span>{shipment.weight} kg</div>
        <div>
          <span className="text-zinc-300 dark:text-zinc-600">COD: </span>
          {shipment.codAmount ? `रु ${Number(shipment.codAmount).toLocaleString()}` : "—"}
        </div>
      </div>

      {/* Deliver form */}
      {mode === "DELIVER" && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-3">
          <div>
            <label className="text-xs text-zinc-400 dark:text-zinc-500 block mb-1">
              COD collected (रु)
            </label>
            <input
              type="number"
              value={codInput}
              onChange={onCodChange}
              placeholder="0"
              className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-blue-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 dark:text-zinc-500 block mb-1">
              Proof of delivery (photo)
            </label>
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-gray-500 dark:hover:border-zinc-500 transition-all">
              <Camera size={14} className="text-zinc-400 dark:text-zinc-500" />
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {podFile ? podFile.name : "Upload photo or signature"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={onPodChange} />
            </label>
          </div>
          <button
            onClick={onDeliver}
            disabled={delivering}
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all"
          >
            {delivering ? "Confirming…" : "Confirm delivery"}
          </button>
        </div>
      )}

      {mode === "PICKUP" && (
        <p className="text-xs text-zinc-500 text-center">
          Tap <span className="text-zinc-300 font-medium">Scan</span> above to confirm pickup and update status.
        </p>
      )}
    </div>
  );
}