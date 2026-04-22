import { useState } from 'react';
import { Printer, QrCode, CheckSquare, Square } from 'lucide-react';
import { useShipments } from '../hooks/useShipment';

export default function Manifests() {
  const { data, loading } = useShipments('PENDING', 1);
  const shipments = data?.shipments ?? [];
  const [selected, setSelected] = useState(new Set());

  const toggle    = id => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(selected.size === shipments.length ? new Set() : new Set(shipments.map(s => s.trackingNumber)));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Manifests and labels</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Generate QR labels to stick on packages</p>
        </div>
        <button onClick={() => window.print()} disabled={selected.size === 0}
          className="flex items-center gap-2 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all">
          <Printer size={14} /> Print {selected.size > 0 ? '(' + selected.size + ')' : 'selected'}
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-center text-zinc-600 text-sm">Loading...</div>
        ) : shipments.length === 0 ? (
          <div className="px-5 py-10 text-center text-zinc-600 text-sm">No pending shipments</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-800">
              <th className="px-4 py-3 text-left">
                <button onClick={toggleAll} className="text-zinc-500 hover:text-zinc-300">
                  {selected.size === shipments.length ? <CheckSquare size={15} className="text-rose-400" /> : <Square size={15} />}
                </button>
              </th>
              {['QR','Tracking','Receiver','Address','Weight','COD',''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {shipments.map(s => (
                <tr key={s.trackingNumber} className={'border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ' + (selected.has(s.trackingNumber) ? 'bg-rose-500/5' : '')}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(s.trackingNumber)} className="text-zinc-500 hover:text-zinc-300">
                      {selected.has(s.trackingNumber) ? <CheckSquare size={15} className="text-rose-400" /> : <Square size={15} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 border border-zinc-700 rounded flex items-center justify-center">
                      <QrCode size={20} className="text-zinc-600" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{s.trackingNumber}</td>
                  <td className="px-4 py-3 text-sm text-zinc-200 font-medium">{s.receiverName}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{s.deliveryAddress}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{s.weight} kg</td>
                  <td className="px-4 py-3 text-xs text-zinc-300">{s.codAmount > 0 ? 'Rs ' + s.codAmount.toLocaleString() : '-'}</td>
                  <td className="px-4 py-3">
                    <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-all">
                      <Printer size={11} /> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
