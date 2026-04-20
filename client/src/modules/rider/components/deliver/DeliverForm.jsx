// src/rider/components/deliver/DeliveryForm.jsx
import { Camera } from 'lucide-react';

export function DeliveryForm({ codCollected, onCodChange, podNote, onNoteChange, podFile, onFileChange }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 mb-4">
      <div>
        <label className="text-xs text-zinc-400 font-medium block mb-1.5">COD collected (रु)</label>
        <input
          type="number"
          min="0"
          value={codCollected}
          onChange={e => onCodChange(e.target.value)}
          placeholder="0"
          className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-lg text-zinc-200 focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-400 font-medium block mb-1.5">Proof of delivery photo</label>
        <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl cursor-pointer transition-all">
          <Camera size={16} className="text-zinc-500" />
          <span className="text-sm text-zinc-500">
            {podFile ? podFile.name : 'Take photo or upload'}
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => onFileChange(e.target.files[0])}
          />
        </label>
      </div>

      <div>
        <label className="text-xs text-zinc-400 font-medium block mb-1.5">Delivery note (optional)</label>
        <input
          value={podNote}
          onChange={e => onNoteChange(e.target.value)}
          placeholder='e.g. "Left with security guard"'
          className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
}