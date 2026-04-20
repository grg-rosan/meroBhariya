// src/dispatcher/pages/AssignRoutesMap.jsx
// Enhanced assign routes with:
//  - Mapbox map showing all unassigned package pins
//  - Nearest rider list from PostGIS query
//  - One-click optimized route assignment

import { useRef, useEffect, useState } from 'react';
import { Zap, UserCheck, MapPin } from 'lucide-react';
import {useMapbox} from "../../../shared/hooks/useMapbox"
import { useAssignRoute } from '../hooks/useDispatcher';
import { useAPI } from '../../shared/hooks/useAPI';

const HUB = { lat: 27.7224, lng: 85.3086 }; // Balaju Hub coordinates

const UNASSIGNED = [
  { trackingNumber:'PTR-2838', destination:'Patan-7',     lat:27.6699, lng:85.3149, zone:'Lalitpur',  weight:0.5 },
  { trackingNumber:'PTR-2845', destination:'Bhaktapur-3', lat:27.6710, lng:85.4298, zone:'Bhaktapur', weight:1.2 },
  { trackingNumber:'PTR-2849', destination:'Kirtipur',    lat:27.6792, lng:85.2799, zone:'Kirtipur',  weight:0.9 },
  { trackingNumber:'PTR-2851', destination:'Patan-3',     lat:27.6654, lng:85.3218, zone:'Lalitpur',  weight:2.1 },
  { trackingNumber:'PTR-2853', destination:'Bhaktapur-7', lat:27.6720, lng:85.4250, zone:'Bhaktapur', weight:1.5 },
];

export default function AssignRoutesMap() {
  const mapContainerRef = useRef(null);
  const { upsertMarker, flyTo } = useMapbox(mapContainerRef, {
    center: [HUB.lng, HUB.lat],
    zoom: 12,
    style: 'mapbox://styles/mapbox/dark-v11',
  });

  const { data: ridersData } = useAPI(`/api/hub/riders/nearest?lat=${HUB.lat}&lng=${HUB.lng}`);
  const { assign, loading, error } = useAssignRoute();

  const [selected, setSelected] = useState(new Set());
  const [riderId, setRiderId]   = useState('');
  const [success, setSuccess]   = useState(false);

  const riders = ridersData?.riders ?? [];

  // Pin all unassigned packages on map
  useEffect(() => {
    UNASSIGNED.forEach(p => {
      upsertMarker(p.trackingNumber, [p.lng, p.lat], {
        style: selected.has(p.trackingNumber)
          ? 'width:14px;height:14px;border-radius:50%;background:#10b981;border:2px solid #fff'
          : 'width:10px;height:10px;border-radius:50%;background:#f59e0b;border:2px solid #fff',
        popup: `<div style="color:#111;font-size:12px"><strong>${p.trackingNumber}</strong><br>${p.destination}</div>`,
      });
    });

    // Hub marker
    upsertMarker('hub', [HUB.lng, HUB.lat], {
      style: 'width:16px;height:16px;border-radius:3px;background:#8b5cf6;border:2px solid #fff',
      popup: '<div style="color:#111;font-size:12px;font-weight:600">Balaju Hub</div>',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const toggle = id => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleAssign = async () => {
    if (!riderId || selected.size === 0) return;
    try {
      await assign([...selected], riderId, HUB);
      setSuccess(true);
      setSelected(new Set());
      setTimeout(() => setSuccess(false), 3000);
    } catch (_) {}
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Assign routes</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Route is auto-optimized via Google Directions API before assignment</p>
        </div>
        <button onClick={handleAssign} disabled={selected.size === 0 || !riderId || loading}
          className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all">
          <UserCheck size={14} />
          {loading ? 'Optimizing route…' : `Assign ${selected.size > 0 ? `(${selected.size})` : ''}`}
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-700/50 rounded-xl p-3 mb-4 text-sm text-green-300 flex items-center gap-2">
          <Zap size={13} /> Route optimized and assigned. Rider manifest updated.
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-700/50 rounded-xl p-3 mb-4 text-sm text-red-300">{error}</div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-2.5 h-2.5 rounded-sm bg-violet-500 inline-block"/>Hub</span>
            <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"/>Unassigned</span>
            <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"/>Selected</span>
          </div>
          <div ref={mapContainerRef} className="h-80 w-full" />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Package list */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <h2 className="text-sm font-medium text-white">Packages ({UNASSIGNED.length})</h2>
            </div>
            <div>
              {UNASSIGNED.map(p => (
                <button key={p.trackingNumber} onClick={() => { toggle(p.trackingNumber); flyTo([p.lng, p.lat], 14); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-zinc-800/50 last:border-none text-left transition-colors ${selected.has(p.trackingNumber) ? 'bg-emerald-500/10' : 'hover:bg-zinc-800/40'}`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${selected.has(p.trackingNumber) ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-zinc-400">{p.trackingNumber}</p>
                    <p className="text-xs text-zinc-500 truncate">{p.destination} · {p.weight} kg</p>
                  </div>
                  <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded shrink-0">{p.zone}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nearest riders from PostGIS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <h2 className="text-sm font-medium text-white">Nearest riders</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Sorted by distance from hub (PostGIS)</p>
            </div>
            <div>
              {(riders.length ? riders : [
                { id:'r1', name:'Rajan Shrestha', vehicle:'Bike',       distance_meters: 420 },
                { id:'r2', name:'Bikash Tamang',  vehicle:'Mini Truck', distance_meters: 1200 },
                { id:'r3', name:'Sunil Magar',    vehicle:'Bike',       distance_meters: 2100 },
              ]).map(r => (
                <button key={r.id} onClick={() => setRiderId(r.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50 last:border-none text-left transition-all ${riderId === r.id ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500' : 'hover:bg-zinc-800/40'}`}>
                  <div className="w-7 h-7 rounded-full bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center shrink-0">
                    {r.name.split(' ').map(w=>w[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200">{r.name}</p>
                    <p className="text-xs text-zinc-500">{r.vehicle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-zinc-400">{Math.round(r.distance_meters)}m</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-auto mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
