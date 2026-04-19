import { Wallet, ArrowDownLeft, Clock, AlertTriangle } from 'lucide-react';
import { useCODLedger } from '../hooks/useMerchant';
import StatCard from '../../shared/components/StatCard';

export default function CODLedger() {
  const { data, loading } = useCODLedger();
  const shipments = data?.shipments ?? [];

  const totalCOD  = shipments.reduce((sum, s) => sum + (s.codAmount ?? 0), 0);
  const collected = shipments.filter(s => s.status === 'DELIVERED').reduce((sum, s) => sum + (s.codAmount ?? 0), 0);
  const pending   = shipments.filter(s => s.status !== 'DELIVERED').reduce((sum, s) => sum + (s.codAmount ?? 0), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">COD ledger</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Track cash-on-delivery collected and owed to you</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard icon={Wallet}        label="Total COD"      value={'Rs ' + totalCOD.toLocaleString()}  color="rose"  />
        <StatCard icon={ArrowDownLeft} label="Collected"      value={'Rs ' + collected.toLocaleString()} color="green" />
        <StatCard icon={Clock}         label="Pending payout" value={'Rs ' + pending.toLocaleString()}   color="amber" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-white">COD by shipment</h2>
        </div>
        {loading ? (
          <div className="px-5 py-10 text-center text-zinc-600 text-sm">Loading...</div>
        ) : shipments.length === 0 ? (
          <div className="px-5 py-10 text-center text-zinc-600 text-sm">No COD shipments found</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-800">
              {['Tracking','Receiver','COD Amount','Status'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {shipments.map(s => (
                <tr key={s.trackingNumber} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{s.trackingNumber}</td>
                  <td className="px-4 py-3 text-xs text-zinc-300">{s.receiverName}</td>
                  <td className="px-4 py-3 text-xs font-medium text-zinc-200">Rs {s.codAmount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">
                    {s.status === 'DELIVERED'
                      ? <span className="text-green-400">Collected</span>
                      : <span className="text-amber-400">Awaiting</span>}
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
