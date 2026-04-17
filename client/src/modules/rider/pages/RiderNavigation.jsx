import { Navigation, Phone, CheckCircle, MapPin } from 'lucide-react';

const REMAINING = [
  { stopNum:3, trackingNumber:'PTR-2840', receiverName:'Raj Gurung',  deliveryAddress:'Koteshwor-7, near Sanischare Chowk', phone:'9841000003', distance:'4.2 km', codAmount:1800 },
  { stopNum:4, trackingNumber:'PTR-2841', receiverName:'Sita Rai',    deliveryAddress:'Patan Dhoka, Lalitpur',              phone:'9841000004', distance:'6.8 km', codAmount:900 },
  { stopNum:5, trackingNumber:'PTR-2842', receiverName:'Manish KC',   deliveryAddress:'Jawalakhel, Lalitpur',               phone:'9841000005', distance:'7.9 km', codAmount:0 },
  { stopNum:6, trackingNumber:'PTR-2843', receiverName:'Deepa Magar', deliveryAddress:'Naxal, Kathmandu',                  phone:'9841000006', distance:'9.2 km', codAmount:1500 },
];

export default function RiderNavigation() {
  const current = REMAINING[0];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Route navigation</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Optimized for {REMAINING.length} remaining drops</p>
      </div>

      {/* Map placeholder */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-4">
        <div className="h-52 flex flex-col items-center justify-center bg-zinc-800/50 gap-2">
          <MapPin size={32} className="text-zinc-600"/>
          <p className="text-sm text-zinc-500">Leaflet / MapLibre map renders here</p>
          <p className="text-xs text-zinc-600">Connect your map library in this component</p>
        </div>
        <div className="px-5 py-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"/>
          <span className="text-xs text-zinc-400">Live GPS · Last updated just now</span>
        </div>
      </div>

      {/* Next stop highlight */}
      <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-sky-400 uppercase tracking-wider">Next stop · {current.stopNum} of {REMAINING.length + 2}</span>
        </div>
        <h2 className="text-lg font-semibold text-white mb-0.5">{current.receiverName}</h2>
        <p className="text-sm text-zinc-400 mb-3">{current.deliveryAddress} · {current.distance}</p>
        {current.codAmount > 0 && (
          <div className="mb-3 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg inline-flex items-center gap-2">
            <span className="text-xs text-amber-400">Collect COD: रु {current.codAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg font-medium transition-all">
            <Navigation size={14}/>Open in maps
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-sm rounded-lg transition-all">
            <Phone size={14}/>Call
          </button>
        </div>
      </div>

      {/* Upcoming stops */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-white">Upcoming stops</h2></div>
        {REMAINING.slice(1).map(stop=>(
          <div key={stop.trackingNumber} className="flex items-center gap-4 px-5 py-3 border-b border-zinc-800/50 last:border-none hover:bg-zinc-800/20 transition-colors">
            <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center text-xs font-medium shrink-0">
              {stop.stopNum}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300 font-medium">{stop.receiverName}</p>
              <p className="text-xs text-zinc-600 truncate">{stop.deliveryAddress} · {stop.distance}</p>
            </div>
            {stop.codAmount > 0 && (
              <span className="text-xs text-amber-400 shrink-0">रु {stop.codAmount.toLocaleString()}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}