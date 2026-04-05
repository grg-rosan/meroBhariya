import { useState } from 'react';
import { ScanLine, CheckCircle, XCircle } from 'lucide-react';
import { useScanIn } from '../hooks/useDispatcher';

const SCAN_LOG = [
  { id:'PTR-2854', merchant:'Kathmandu Gifts', time:'12:10 PM', status:'IN_HUB' },
  { id:'PTR-2853', merchant:'Nepal Mart',      time:'11:40 AM', status:'IN_HUB' },
  { id:'PTR-2852', merchant:'Patan Crafts',    time:'11:22 AM', status:'IN_HUB' },
  { id:'PTR-2851', merchant:'Himalayan Traders',time:'11:00 AM',status:'ASSIGNED' },
  { id:'PTR-2849', merchant:'Craft Nepal',     time:'10:45 AM', status:'IN_HUB' },
];

export default function ScanIn() {
  const { scanIn, loading, result, error } = useScanIn();
  const [input, setInput] = useState('');
  const [note, setNote]   = useState('');
  const [log, setLog]     = useState(SCAN_LOG);

  const handleScan = async () => {
    if (!input.trim()) return;
    try {
      const data = await scanIn(input.trim(), note);
      setLog(prev => [{ id: input.trim(), merchant: data?.merchant ?? 'Unknown', time: 'Just now', status: 'IN_HUB' }, ...prev]);
      setInput('');
      setNote('');
    } catch (_) {}
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Scan in to hub</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Mark packages as arrived at Balaju Hub</p>
      </div>

      {/* Scan area */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-4">
        <div className={`border-2 border-dashed rounded-xl p-8 text-center mb-4 transition-all ${result ? 'border-green-600 bg-green-500/5' : 'border-zinc-700'}`}>
          <div className="w-16 h-16 border-2 border-emerald-500/50 rounded-xl mx-auto mb-3 flex items-center justify-center">
            <ScanLine size={28} className="text-emerald-500" />
          </div>
          <p className="text-sm text-zinc-400 mb-4">Scan QR code or enter tracking number</p>
          <div className="flex gap-2 justify-center">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              placeholder="PTR-XXXX"
              className="w-44 px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
            <button onClick={handleScan} disabled={loading || !input.trim()}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all">
              {loading ? 'Scanning…' : 'Confirm'}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-500 block mb-1.5">Hub note (optional)</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder='e.g. "Package damaged on arrival"'
            className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500" />
        </div>
      </div>

      {/* Feedback */}
      {result && (
        <div className="bg-green-500/10 border border-green-700/50 rounded-xl p-3 mb-4 flex items-center gap-2">
          <CheckCircle size={14} className="text-green-400" />
          <span className="text-sm text-green-300">{result.trackingNumber ?? input} — marked as IN_HUB</span>
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-700/50 rounded-xl p-3 mb-4 flex items-center gap-2">
          <XCircle size={14} className="text-red-400" /><span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Today's scan log */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Scanned today</h2>
          <span className="text-xs text-zinc-500">{log.length} packages</span>
        </div>
        {log.map((item, i) => (
          <div key={`${item.id}-${i}`} className="flex items-center gap-4 px-5 py-3 border-b border-zinc-800/50 last:border-none hover:bg-zinc-800/20 transition-colors">
            <span className="font-mono text-xs text-zinc-400 w-24 shrink-0">{item.id}</span>
            <span className="text-xs text-zinc-400 flex-1">{item.merchant}</span>
            <span className="text-xs text-zinc-600 w-20 text-right shrink-0">{item.time}</span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${item.status === 'IN_HUB' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
              {item.status === 'IN_HUB' ? 'At hub' : 'Assigned'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}