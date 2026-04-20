// src/rider/components/navigation/CurrentStop.jsx
import { Navigation, Phone } from 'lucide-react';

export function CurrentStop({ stop, stopCount }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.deliveryAddress)}`;

  return (
    <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-5">
      <span className="text-xs font-medium text-sky-400 uppercase tracking-wider">
        Next stop · {stop.stopNum} of {stopCount}
      </span>

      <h2 className="text-lg font-semibold text-white mt-2 mb-0.5">{stop.receiverName}</h2>
      <p className="text-sm text-zinc-400 mb-3">{stop.deliveryAddress}</p>

      {stop.codAmount > 0 && (
        <div className="mb-3 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg inline-flex items-center gap-2">
          <span className="text-xs text-amber-400">
            Collect COD: रु {stop.codAmount.toLocaleString()}
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <a 
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg font-medium transition-all"
        >
          <Navigation size={14} />Open in maps
        </a>
                <a 
          href={`tel:${stop.phone}`}
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-sm rounded-lg transition-all"
        >
          <Phone size={14} />Call
        </a>
      </div>
    </div>
  );
}