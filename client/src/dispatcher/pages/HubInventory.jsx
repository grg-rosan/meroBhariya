import { useState } from 'react';
import { Search, RefreshCw, Boxes } from 'lucide-react';
import { useHubInventory } from '../hooks/useDispatcher';
import StatusBadge from '../../shared/components/StatusBadge';
import StatCard from '../../shared/components/StatCard';

const ZONES = ['All zones', 'Lalitpur', 'Bhaktapur', 'Kirtipur', 'KTM East', 'Kavrepalanchok'];

export default function HubInventory() {
  const { data, loading, error, refetch } = useHubInventory();

  const items = data?.shipments ?? [];

  // Derive stats from live data
  const stats = {
    total:           items.length,
    unassigned:      items.filter(i => i.status === 'IN_HUB').length,
    assigned:        items.filter(i => i.status === 'ASSIGNED').length,
    outForDelivery:  items.filter(i => i.status === 'OUT_FOR_DELIVERY').length,
  };

  const [search, setSearch]   = useState('');
  const [zone, setZone]       = useState('All zones');
  const [statusF, setStatusF] = useState('');

  // Normalise field names — API uses shipment model shape
  const normalise = (s) => ({
    trackingNumber: s.trackingNumber,
    merchant:       s.merchant?.businessName ?? s.merchant?.fullName ?? '—',
    destination:    s.deliveryAddress ?? '—',
    zone:           s.zone ?? '—',
    arrivedAt:      s.arrivedAt
      ? new Date(s.arrivedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : s.createdAt
        ? new Date(s.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '—',
    status: s.status,
  });

  const filtered = items
    .map(normalise)
    .filter(i =>
      (!search ||
        i.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
        i.merchant.toLowerCase().includes(search.toLowerCase())) &&
      (zone === 'All zones' || i.zone === zone) &&
      (!statusF || i.status === statusF)
    );

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Balaju hub — inventory</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Live count of packages at this hub</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-all"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-700/40 rounded-xl p-3 mb-4 text-sm text-red-400">
          Failed to load inventory: {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Boxes} label="Total at hub"     value={stats.total}          color="emerald" />
        <StatCard icon={Boxes} label="Unassigned"       value={stats.unassigned}     color="red"     />
        <StatCard icon={Boxes} label="Assigned"         value={stats.assigned}       color="amber"   />
        <StatCard icon={Boxes} label="Out for delivery" value={stats.outForDelivery} color="green"   />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tracking or merchant…"
            className="pl-8 pr-3 py-1.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-56"
          />
        </div>
        <select
          value={zone}
          onChange={e => setZone(e.target.value)}
          className="px-3 py-1.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:border-zinc-600"
        >
          {ZONES.map(z => <option key={z}>{z}</option>)}
        </select>
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {[
            { v: '',                 l: 'All'      },
            { v: 'IN_HUB',           l: 'At hub'   },
            { v: 'ASSIGNED',         l: 'Assigned' },
            { v: 'OUT_FOR_DELIVERY', l: 'Out'      },
          ].map(f => (
            <button
              key={f.v}
              onClick={() => setStatusF(f.v)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                statusF === f.v ? 'bg-emerald-500 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Table — scrollable on mobile */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Tracking #', 'Merchant', 'Destination', 'Zone', 'Arrived', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-zinc-800 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-600 text-sm">
                    No packages match filters
                  </td>
                </tr>
              ) : (
                filtered.map(i => (
                  <tr
                    key={i.trackingNumber}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                  >
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
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-zinc-800">
          <span className="text-xs text-zinc-600">
            {loading ? 'Loading…' : `Showing ${filtered.length} of ${items.length} packages`}
          </span>
        </div>
      </div>
    </div>
  );
}