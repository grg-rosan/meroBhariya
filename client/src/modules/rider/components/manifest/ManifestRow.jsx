// src/rider/components/manifest/ManifestStopRow.jsx
import { useNavigate } from 'react-router-dom';
import { Navigation, Phone } from 'lucide-react';

export function ManifestStopRow({ stop }) {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/rider/navigate', { state: { stop } });
  };

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800/50 last:border-none hover:bg-zinc-800/20 transition-colors">
      {/* Stop number badge */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
        stop.status === 'delivered'
          ? 'bg-green-500/20 text-green-400'
          : stop.isActive
            ? 'bg-sky-500 text-white'
            : 'bg-zinc-800 text-zinc-500'
      }`}>
        {stop.stopNum}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-zinc-200">{stop.receiverName}</p>
          {stop.codAmount > 0 && (
            <span className="text-xs px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full">
              COD रु {stop.codAmount.toLocaleString()}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500 truncate mt-0.5">
          {stop.trackingNumber} · {stop.deliveryAddress} · {stop.weight}
        </p>
      </div>

      {/* Actions / Status */}
      {stop.status === 'delivered' ? (
        <span className="text-xs text-green-400 font-medium shrink-0">Delivered</span>
      ) : stop.isActive ? (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleNavigate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-lg transition-all"
          >
            <Navigation size={12} />Navigate
          </button>
          
          {/* Fixed: Added missing <a tag start */}
          <a 
            href={`tel:${stop.phone}`}
            className="w-8 h-8 flex items-center justify-center border border-zinc-700 hover:bg-zinc-800 text-zinc-400 rounded-lg transition-all"
          >
            <Phone size={13} />
          </a>
        </div>
      ) : (
        <span className="text-xs text-zinc-500 font-medium shrink-0">Pending</span>
      )}
    </div>
  );
}