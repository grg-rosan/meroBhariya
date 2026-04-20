// src/admin/pages/Settlement.jsx
import { useState } from 'react';
import { Landmark, CheckCircle, RefreshCw } from 'lucide-react';
import { useRiderSettlements, useSettleCOD } from '../hooks/useAdmin';

export default function Settlements() {
  const { data, loading, refetch }    = useRiderSettlements();
  const { settleAllForRider, loading: settling } = useSettleCOD();

  const [settled,  setSettled]  = useState(new Set());
  const [settling2, setSettling] = useState(null);
  const [selected, setSelected] = useState(new Set());

  // backend: /settlements/riders → { riders: [{ id, fullName, vehicleType, totalCOD, shipmentCount }] }
  const allRiders = data?.riders ?? [];
  const riders    = allRiders.filter(r => !settled.has(r.id));
  const total     = riders.reduce((s, r) => s + (r.totalCOD ?? r.owed ?? 0), 0);

  const handleSettle = async (rider) => {
    setSettling(rider.id);
    try {
      await settleAllForRider(rider.id);
      setSettled(s => new Set([...s, rider.id]));
    } catch (_) {}
    finally { setSettling(null); }
  };

  const handleSettleSelected = async () => {
    for (const rider of riders.filter(r => selected.has(r.id))) {
      await handleSettle(rider);
    }
    setSelected(new Set());
  };

  const toggleSelect = (id) => setSelected(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const allSelected = riders.length > 0 && selected.size === riders.length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">COD settlements</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Settle collected COD back to merchants via riders</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="p-2 text-zinc-400 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-all"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={handleSettleSelected}
            disabled={selected.size === 0 || !!settling2}
            className="flex items-center gap-2 px-4 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all"
          >
            <Landmark size={14} /> Settle selected ({selected.size})
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-zinc-900 border border-amber-700/30 rounded-xl p-4 mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Total pending settlement</p>
          <p className="text-2xl font-semibold text-amber-400">रु {total.toLocaleString()}</p>
        </div>
        <p className="text-xs text-zinc-500">{riders.length} riders with unsettled COD</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(riders.map(r => r.id)))}
                  className="accent-violet-500"
                />
              </th>
              {['Rider', 'Vehicle', 'COD held', 'Shipments', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-800/50">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-3 bg-zinc-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : riders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-600 text-sm">
                  All riders settled — nothing pending
                </td>
              </tr>
            ) : (
              riders.map(r => (
                <tr
                  key={r.id}
                  className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors ${selected.has(r.id) ? 'bg-violet-500/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="accent-violet-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-200">{r.fullName ?? r.name}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{r.vehicleType}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-amber-400">
                    रु {(r.totalCOD ?? r.owed ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{r.shipmentCount ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSettle(r)}
                      disabled={settling2 === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium disabled:opacity-40 transition-all"
                    >
                      {settling2 === r.id
                        ? <RefreshCw size={11} className="animate-spin" />
                        : <CheckCircle size={11} />
                      }
                      Settle
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}