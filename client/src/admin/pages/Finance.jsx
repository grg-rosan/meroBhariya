import { Wallet, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { useFinanceSummary } from '../hooks/useAdmin';
import StatCard from '../../shared/components/StatCard';

const MOCK = { totalCOD: 1480000, heldByRiders: 210000, owedToMerchants: 1120000, platformRevenue: 150000 };

const RIDERS = [
  { name: 'Rajan Shrestha', vehicle: 'Bike',       held: 18400, lastDrop: 'Today' },
  { name: 'Bikash Tamang',  vehicle: 'Mini Truck',  held: 42800, lastDrop: 'Today' },
  { name: 'Sunil Magar',    vehicle: 'Bike',        held: 9200,  lastDrop: 'Yesterday' },
  { name: 'Nabin Thapa',    vehicle: 'Covered Van', held: 84000, lastDrop: 'Today' },
  { name: 'Sagar Rai',      vehicle: 'Bike',        held: 5600,  lastDrop: '2 days ago' },
];

const MERCHANTS = [
  { name: 'Himalayan Traders',  owed: 84200,  lastSettled: '9 Apr' },
  { name: 'Nepal Mart',         owed: 41800,  lastSettled: '10 Apr' },
  { name: 'Patan Crafts',       owed: 22400,  lastSettled: '7 Apr' },
  { name: 'Kathmandu Gifts',    owed: 18900,  lastSettled: '11 Apr' },
];

export default function Finance() {
  const { data } = useFinanceSummary();
  const s = data ?? MOCK;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Finance summary</h1>
        <p className="text-sm text-zinc-500 mt-0.5">COD held vs. owed to merchants — live snapshot</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Wallet}        label="Total COD collected" value={`रु ${(s.totalCOD/100000).toFixed(1)}L`}          color="violet" />
        <StatCard icon={AlertTriangle} label="Held by riders"      value={`रु ${(s.heldByRiders/100000).toFixed(1)}L`}      color="red"    />
        <StatCard icon={Users}         label="Owed to merchants"   value={`रु ${(s.owedToMerchants/100000).toFixed(1)}L`}   color="amber"  />
        <StatCard icon={TrendingUp}    label="Platform revenue"    value={`रु ${(s.platformRevenue/100000).toFixed(1)}L`}   color="green"  />
      </div>

      {/* Cash flow bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-medium text-white mb-3">Cash flow breakdown</h2>
        <div className="h-5 bg-zinc-800 rounded-full overflow-hidden flex">
          <div className="h-full bg-red-500/70 transition-all"    style={{ width: `${(s.heldByRiders/s.totalCOD)*100}%` }} title="Held by riders"/>
          <div className="h-full bg-amber-500/70 transition-all"  style={{ width: `${(s.owedToMerchants/s.totalCOD)*100}%` }} title="Owed to merchants"/>
          <div className="h-full bg-violet-500/70 transition-all" style={{ width: `${(s.platformRevenue/s.totalCOD)*100}%` }} title="Platform revenue"/>
        </div>
        <div className="flex gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/70 inline-block"/>Riders</span>
          <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/70 inline-block"/>Merchants</span>
          <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-2.5 h-2.5 rounded-sm bg-violet-500/70 inline-block"/>Platform</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Cash held per rider */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Cash held by riders</h2>
            <span className="text-xs text-red-400">रु {s.heldByRiders.toLocaleString()} total</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-800">
              {['Rider','Vehicle','COD held','Last drop'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {RIDERS.map(r => (
                <tr key={r.name} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 text-sm text-zinc-200 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{r.vehicle}</td>
                  <td className="px-4 py-3 text-sm font-medium text-red-400">रु {r.held.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{r.lastDrop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Owed per merchant */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Owed to merchants</h2>
            <span className="text-xs text-amber-400">रु {s.owedToMerchants.toLocaleString()} total</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-800">
              {['Merchant','Amount owed','Last settled'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {MERCHANTS.map(m => (
                <tr key={m.name} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 text-sm text-zinc-200 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-sm font-medium text-amber-400">रु {m.owed.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{m.lastSettled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}