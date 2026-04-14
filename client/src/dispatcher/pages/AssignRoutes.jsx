import { useState } from 'react';
import { CheckSquare, Square, Zap, UserCheck } from 'lucide-react';
import { useAssignRoute, useAvailableRiders, useHubInventory } from '../hooks/useDispatcher';

export default function AssignRoutes() {
  const { assign, loading: assigning, error } = useAssignRoute();

  // Pull unassigned packages from inventory
  const { data: inventoryData, loading: invLoading } = useHubInventory();
  const allItems = inventoryData?.shipments ?? [];
  const unassigned = allItems.filter(s => s.status === 'IN_HUB');

  // Riders — vehicleTypeId is optional; pass '' to get all available
  const { data: ridersData, loading: ridersLoading } = useAvailableRiders('');
  const riders = ridersData?.riders ?? [];

  const [selected, setSelected]   = useState(new Set());
  const [riderId, setRiderId]      = useState('');
  const [success, setSuccess]      = useState(false);

  const selectedRider = riders.find(r => r.id === riderId);

  const toggle = (id) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(selected.size === unassigned.length
      ? new Set()
      : new Set(unassigned.map(p => p.id)));   // use DB id for assignment

  const handleAssign = async () => {
    if (!riderId || selected.size === 0) return;
    try {
      await assign([...selected], riderId);
      setSuccess(true);
      setSelected(new Set());
      setTimeout(() => setSuccess(false), 3000);
    } catch (_) {}
  };

  const totalWeight = unassigned
    .filter(p => selected.has(p.id))
    .reduce((s, p) => s + (p.weight ?? 0), 0);

  const getMerchantName = (s) =>
    s.merchant?.businessName ?? s.merchant?.fullName ?? '—';

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Assign routes</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Move packages from hub to a rider's manifest</p>
        </div>
        <button
          onClick={handleAssign}
          disabled={selected.size === 0 || !riderId || assigning}
          className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all"
        >
          <UserCheck size={14} />
          {assigning ? 'Assigning…' : `Assign${selected.size > 0 ? ` (${selected.size})` : ''} to rider`}
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-700/50 rounded-xl p-3 mb-4 text-sm text-green-300 flex items-center gap-2">
          <UserCheck size={14} /> Packages assigned successfully{selectedRider ? ` to ${selectedRider.fullName}` : ''}.
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-700/50 rounded-xl p-3 mb-4 text-sm text-red-300">{error}</div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Package list */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">
              Unassigned packages ({invLoading ? '…' : unassigned.length})
            </h2>
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {selected.size === unassigned.length && unassigned.length > 0
                ? <CheckSquare size={13} className="text-emerald-400" />
                : <Square size={13} />}
              {selected.size === unassigned.length && unassigned.length > 0 ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-2.5 text-left w-8" />
                  {['Tracking #', 'Merchant', 'Destination', 'Zone', 'Weight'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs text-zinc-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-zinc-800/50">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-3 py-3">
                          <div className="h-3 bg-zinc-800 rounded animate-pulse w-16" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : unassigned.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-zinc-600 text-sm">
                      No unassigned packages
                    </td>
                  </tr>
                ) : (
                  unassigned.map(p => (
                    <tr
                      key={p.id}
                      onClick={() => toggle(p.id)}
                      className={`border-b border-zinc-800/50 cursor-pointer transition-colors ${
                        selected.has(p.id) ? 'bg-emerald-500/5' : 'hover:bg-zinc-800/30'
                      }`}
                    >
                      <td className="px-4 py-3">
                        {selected.has(p.id)
                          ? <CheckSquare size={14} className="text-emerald-400" />
                          : <Square size={14} className="text-zinc-600" />}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-zinc-400">{p.trackingNumber}</td>
                      <td className="px-3 py-3 text-xs text-zinc-300">{getMerchantName(p)}</td>
                      <td className="px-3 py-3 text-xs text-zinc-500">{p.deliveryAddress ?? '—'}</td>
                      <td className="px-3 py-3">
                        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                          {p.zone ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-zinc-400">
                        {p.weight != null ? `${p.weight} kg` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selected.size > 0 && (
            <div className="px-5 py-3 border-t border-zinc-800 bg-emerald-500/5">
              <span className="text-xs text-emerald-400">
                {selected.size} packages selected · {totalWeight.toFixed(1)} kg total
              </span>
            </div>
          )}
        </div>

        {/* Rider selector */}
        <div className="space-y-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="text-sm font-medium text-white mb-3">Select rider</h2>
            {ridersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-zinc-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : riders.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">No riders available</p>
            ) : (
              <div className="space-y-2">
                {riders.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRiderId(r.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      riderId === r.id
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center justify-center shrink-0">
                      {(r.fullName ?? r.name ?? 'R').split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 font-medium">{r.fullName ?? r.name}</p>
                      <p className="text-xs text-zinc-500">
                        {r.vehicleType?.name ?? r.vehicle ?? 'Rider'} · {r.dropsToday ?? 0} drops today
                      </p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="w-full flex items-center gap-2 justify-center py-2.5 border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 rounded-xl text-sm transition-all">
            <Zap size={14} /> Auto-assign by zone
          </button>
        </div>
      </div>
    </div>
  );
}