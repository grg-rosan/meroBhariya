import { useState } from 'react';
import { Printer, QrCode, CheckSquare, Square } from 'lucide-react';

const MOCK = [
  { trackingNumber: 'PTR-2840', receiverName: 'Priya Thapa',  deliveryAddress: 'Lalitpur-3',  codAmount: 1800, weight: 0.8 },
  { trackingNumber: 'PTR-2839', receiverName: 'Raj Gurung',   deliveryAddress: 'Bhaktapur',   codAmount: 0,    weight: 2.1 },
  { trackingNumber: 'PTR-2838', receiverName: 'Sita Rai',     deliveryAddress: 'Patan-7',     codAmount: 900,  weight: 0.5 },
  { trackingNumber: 'PTR-2836', receiverName: 'Deepa Magar',  deliveryAddress: 'Baneshwor',   codAmount: 1200, weight: 1.0 },
  { trackingNumber: 'PTR-2835', receiverName: 'Suresh Lama',  deliveryAddress: 'Kalanki',     codAmount: 0,    weight: 4.2 },
];

function QRPlaceholder({ id }) {
  return (
    <div className="w-12 h-12 border border-zinc-700 rounded flex items-center justify-center">
      <QrCode size={24} className="text-zinc-600" />
    </div>
  );
}

export default function Manifests() {
  const [selected, setSelected] = useState(new Set());

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === MOCK.length) setSelected(new Set());
    else setSelected(new Set(MOCK.map((s) => s.trackingNumber)));
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Manifests & labels</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Generate QR labels to stick on packages</p>
        </div>
        <button
          onClick={handlePrint}
          disabled={selected.size === 0}
          className="flex items-center gap-2 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all"
        >
          <Printer size={14} />
          Print {selected.size > 0 ? `(${selected.size})` : 'selected'}
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left">
                  <button onClick={toggleAll} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                    {selected.size === MOCK.length
                      ? <CheckSquare size={15} className="text-rose-400" />
                      : <Square size={15} />
                    }
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">QR</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Tracking #</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Receiver</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Address</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Weight</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">COD</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {MOCK.map((s) => (
                <tr
                  key={s.trackingNumber}
                  className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                    selected.has(s.trackingNumber) ? 'bg-rose-500/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(s.trackingNumber)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                      {selected.has(s.trackingNumber)
                        ? <CheckSquare size={15} className="text-rose-400" />
                        : <Square size={15} />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3"><QRPlaceholder id={s.trackingNumber} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{s.trackingNumber}</td>
                  <td className="px-4 py-3 text-sm text-zinc-200 font-medium">{s.receiverName}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{s.deliveryAddress}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{s.weight} kg</td>
                  <td className="px-4 py-3 text-xs text-zinc-300">
                    {s.codAmount > 0 ? `रु ${s.codAmount.toLocaleString()}` : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-all"
                    >
                      <Printer size={11} /> Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}