import { useState } from 'react';
import { Search, RefreshCw, Boxes } from 'lucide-react';
import { useHubInventory } from '../hooks/useDispatcher';
import StatusBadge from '../../shared/components/StatusBadge';
import StatCard from '../../shared/components/StatCard';

const MOCK_STATS = { total: 134, unassigned: 47, assigned: 68, outForDelivery: 19 };
const MOCK_ITEMS = [
  { trackingNumber:'PTR-2838', merchant:'Himalayan Traders', destination:'Patan-7',       arrivedAt:'08:14 AM', status:'IN_HUB',           zone:'Lalitpur' },
  { trackingNumber:'PTR-2845', merchant:'Kathmandu Gifts',   destination:'Bhaktapur-3',   arrivedAt:'09:30 AM', status:'IN_HUB',           zone:'Bhaktapur' },
  { trackingNumber:'PTR-2847', merchant:'Nepal Mart',        destination:'Lalitpur-10',   arrivedAt:'10:02 AM', status:'ASSIGNED',         zone:'Lalitpur' },
  { trackingNumber:'PTR-2849', merchant:'Craft Nepal',       destination:'Kirtipur',      arrivedAt:'10:45 AM', status:'IN_HUB',           zone:'Kirtipur' },
  { trackingNumber:'PTR-2851', merchant:'Himalayan Traders', destination:'Patan-3',       arrivedAt:'11:00 AM', status:'IN_HUB',           zone:'Lalitpur' },
  { trackingNumber:'PTR-2852', merchant:'Patan Crafts',      destination:'Banepa',        arrivedAt:'11:22 AM', status:'OUT_FOR_DELIVERY', zone:'Kavrepalanchok' },
  { trackingNumber:'PTR-2853', merchant:'Nepal Mart',        destination:'Bhaktapur-7',   arrivedAt:'11:40 AM', status:'IN_HUB',           zone:'Bhaktapur' },
  { trackingNumber:'PTR-2854', merchant:'Kathmandu Gifts',   destination:'Koteshwor',     arrivedAt:'12:10 PM', status:'ASSIGNED',         zone:'KTM East' },
];

const ZONES = ['All zones', 'Lalitpur', 'Bhaktapur', 'Kirtipur', 'KTM East', 'Kavrepalanchok'];

export default function HubInventory() {
  const { data, loading, refetch } = useHubInventory();
  const stats = data?.stats ?? MOCK_STATS;
  const items = data?.items ?? MOCK_ITEMS;

  const [search, setSearch]   = useState('');
  const [zone, setZone]       = useState('All zones');
  const [statusF, setStatusF] = useState('');

  const filtered = items.filter(i =>
    (!search || i.trackingNumber.toLowerCase().includes(search.toLowerCase()) || i.merchant.toLowerCase().includes(search.toLowerCase())) &&
    (zone === 'All zones' || i.zone === zone) &&
    (!statusF || i.status === statusF)
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Balaju hub — inventory</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Live count of packages at this hub</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-all">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Boxes} label="Total at hub"      value={stats.total}           color="emerald" />
        <StatCard icon={Boxes} label="Unassigned"        value={stats.unassigned}      color="red"     />
        <StatCard icon={Boxes} label="Assigned"          value={stats.assigned}        color="amber"   />
        <StatCard icon={Boxes} label="Out for delivery"  value={stats.outForDelivery}  color="green"   />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracking or merchant…"
            className="pl-8 pr-3 py-1.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-56" />
        </div>
        <select value={zone} onChange={e => setZone(e.target.value)}
          className="px-3 py-1.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:border-zinc-600">
          {ZONES.map(z => <option key={z}>{z}</option>)}
        </select>
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {[{v:'',l:'All'},{v:'IN_HUB',l:'At hub'},{v:'ASSIGNED',l:'Assigned'},{v:'OUT_FOR_DELIVERY',l:'Out'}].map(f => (
            <button key={f.v} onClick={() => setStatusF(f.v)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${statusF === f.v ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-zinc-800">
            {['Tracking #','Merchant','Destination','Zone','Arrived','Status'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-600 text-sm">No packages match filters</td></tr>
              : filtered.map(i => (
                <tr key={i.trackingNumber} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{i.trackingNumber}</td>
                  <td className="px-4 py-3 text-sm text-zinc-200">{i.merchant}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{i.destination}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{i.zone}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{i.arrivedAt}</td>
                  <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-zinc-800">
          <span className="text-xs text-zinc-600">Showing {filtered.length} of {items.length} packages</span>
        </div>
      </div>
    </div>
  );
}