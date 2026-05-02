// src/rider/components/deliver/DeliveryForm.jsx
import { Camera } from "lucide-react";

export function DeliveryForm({
  codCollected,
  onCodChange,
  podNote,
  onNoteChange,
  podFile,
  onFileChange,
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 mb-4">
      <div>
        <label className="text-xs text-gray-500 dark:text-zinc-400 font-medium block mb-1.5">
          COD collected (रु)
        </label>
        <input
          type="number"
          min="0"
          value={codCollected}
          onChange={(e) => onCodChange(e.target.value)}
          placeholder="0"
          className="w-full px-3 py-2.5 text-sm bg-gray-100 dark:bg-blue-950 border border-gray-300 dark:border-zinc-700 focus:border-zinc-500 rounded-lg text-gray-800 dark:text-zinc-200 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 dark:text-zinc-400 font-medium block mb-1.5">
          Proof of delivery photo
        </label>
        <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-gray-300 dark:border-zinc-700 hover:border-gray-500 dark:hover:border-zinc-500 rounded-xl cursor-pointer transition-all">
          <Camera size={16} className="text-gray-400 dark:text-zinc-500" />
          <span className="text-sm text-gray-400 dark:text-zinc-500">
            {podFile ? podFile.name : "Take photo or upload"}
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files[0])}
          />
        </label>
      </div>

      <div>
        <label className="text-xs text-gray-500 dark:text-zinc-400 font-medium block mb-1.5">
          Delivery note (optional)
        </label>
        <input
          value={podNote}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder='e.g. "Left with security guard"'
          className="w-full px-3 py-2.5 text-sm bg-gray-100 dark:bg-blue-950 border border-gray-300 dark:border-zinc-700 focus:border-zinc-500 rounded-lg text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
}
