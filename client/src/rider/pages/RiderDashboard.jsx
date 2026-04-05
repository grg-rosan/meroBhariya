import { useState } from 'react';
import { Package, MapPin, Banknote, TrendingUp } from 'lucide-react';
import { useRiderDashboard, useToggleDuty } from '../hooks/useRider';
import StatCard from '../../shared/components/StatCard';

const MOCK = { deliveriesToday:12, codCollected:18400, kmCovered:34, earnings:1240, isOnline:true };
const TIMELINE = [
  { time:'9:14 AM',  text:'Picked up 8 packages from Himalayan Traders, Thamel' },
  { time:'10:02 AM', text:'Delivered PTR-2831 to Aarav Shah, Lazimpat' },
  { time:'10:41 AM', text:'Delivered PTR-2832 — COD collected रु 2,400' },
  { time:'11:30 AM', text:'Arrived at Balaju Hub — dropped 2 returns' },
  { time:'1:02 PM',  text:'Resumed route — 6 drops remaining' },
];

export default function RiderDashboard() {
  const { data, loading }     = useRiderDashboard();
  const { toggle, loading: tl } = useToggleDuty();
  const s = data ?? MOCK;
  const [online, setOnline] = useState(s.isOnline ?? true);

  const handleToggle = async () => {
    try { await toggle(!online); setOnline(o=>!o); } catch (_) {}
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">My shift</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Rajan Shrestha · Bike · NP 01 PA 2391</p>
        </div>
        {/* Duty toggle */}
        <button onClick={handleToggle} disabled={tl}
          className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${online?'border-green-600 bg-green-500/10':'border-zinc-700 bg-zinc-900'}`}>
          <div className={`relative w-9 h-5 rounded-full transition-colors ${online?'bg-green-500':'bg-zinc-700'}`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${online?'left-[18px]':'left-0.5'}`}/>
          </div>
          <span className={`text-sm font-medium ${online?'text-green-400':'text-zinc-500'}`}>
            {online ? 'On duty' : 'Off duty'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Package}    label="Deliveries today"  value={s.deliveriesToday}                        color="sky"   />
        <StatCard icon={Banknote}   label="COD collected"     value={`रु ${s.codCollected?.toLocaleString()}`} color="green" />
        <StatCard icon={MapPin}     label="Km covered"        value={`${s.kmCovered} km`}                      color="blue"  />
        <StatCard icon={TrendingUp} label="Today's earnings"  value={`रु ${s.earnings?.toLocaleString()}`}     color="amber" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="text-sm font-medium text-white mb-4">Today's activity</h2>
        <div className="relative pl-5">
          {TIMELINE.map((item, i) => (
            <div key={i} className="relative pb-4 last:pb-0">
              <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-sky-500 border-2 border-zinc-900 z-10"/>
              {i < TIMELINE.length - 1 && <div className="absolute -left-[15px] top-3 w-px h-full bg-zinc-800"/>}
              <p className="text-sm text-zinc-300">{item.text}</p>
              <p className="text-xs text-zinc-600 mt-0.5">{item.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}