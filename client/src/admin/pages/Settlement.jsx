import { useState } from 'react';
import { Landmark, CheckCircle, RefreshCw } from 'lucide-react';
import { useSettlements, useSettle } from '../hooks/useAdmin';

const MOCK = [
  { id: 'm1', name: 'Himalayan Traders', owed: 84200,  method: 'Bank transfer', lastSettled: '9 Apr',  account: 'NIC Asia ****4821' },
  { id: 'm2', name: 'Nepal Mart',        owed: 41800,  method: 'eSewa',         lastSettled: '10 Apr', account: 'eSewa ****1234' },
  { id: 'm3', name: 'Patan Crafts',      owed: 22400,  method: 'Bank transfer', lastSettled: '7 Apr',  account: 'Nabil ****9910' },
  { id: 'm4', name: 'Kathmandu Gifts',   owed: 18900,  method: 'eSewa',         lastSettled: '11 Apr', account: 'eSewa ****5678' },
  { id: 'm5', name: 'Craft Nepal',       owed: 14700,  method: 'Bank transfer', lastSettled: '8 Apr',  account: 'Everest ****3302' },
];

export default function Settlements() {
  const { data, refetch }         = useSettlements();
  const { settle, loading }       = useSettle();
  const [settled, setSettled]     = useState(new Set());
  const [settling, setSettling]   = useState(null);
  const [selected, setSelected]   = useState(new Set());

  const merchants = (data?.pending ?? MOCK).filter(m => !settled.has(m.id));
  const total = merchants.reduce((s, m) => s + m.owed, 0);

  const handleSettle = async (m) => {
    setSettling(m.id);
    try { await settle(m.id); setSettled(s => new Set([...s, m.id])); }
    catch (_) {}
    finally { setSettling(null); }
  };

  const handleSettleAll = async () => {
    for (const m of merchants.filter(m => selected.has(m.id))) {
      await handleSettle(m);
    }
    setSelected(new Set());
  };

  const toggleSelect = (id) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">COD settlements</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Remit collected COD back to merchants</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="p-2 text-zinc-400 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-all">
            <RefreshCw size={14} />
          </button>
          <button onClick={handleSettleAll} disabled={selected.size === 0 || loading}
            className="flex items-center gap-2 px-4 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all">
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
        <p className="text-xs text-zinc-500">{merchants.length} merchants waiting</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-zinc-800">
            <th className="px-4 py-3 text-left">
              <input type="checkbox"
                checked={selected.size === merchants.length && merchants.length > 0}
                onChange={() => setSelected(selected.size === merchants.length ? new Set() : new Set(merchants.map(m => m.id)))}
                className="accent-violet-500" />
            </th>
            {['Merchant','Amount owed','Payment method','Account','Last settled','Action'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {merchants.length === 0
              ? <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-600 text-sm">All merchants settled — nothing pending</td></tr>
              : merchants.map(m => (
                <tr key={m.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors ${selected.has(m.id) ? 'bg-violet-500/5' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleSelect(m.id)} className="accent-violet-500" />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-200">{m.name}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-amber-400">रु {m.owed.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{m.method}</td>
                  <td className="px-4 py-3 text-xs text-zinc-600">{m.account}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{m.lastSettled}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleSettle(m)} disabled={settling === m.id || loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium disabled:opacity-40 transition-all">
                      {settling === m.id
                        ? <RefreshCw size={11} className="animate-spin" />
                        : <CheckCircle size={11} />
                      }
                      Settle
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}