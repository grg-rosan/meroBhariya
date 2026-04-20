import { Wallet, ArrowDownLeft, Clock, AlertTriangle } from 'lucide-react';
import { useCODLedger } from '../hooks/useMerchant';
import StatCard from '../../../shared/components/StatCard';



export default function CODLedger() {
  const { data } = useCODLedger();
  const sum  = data?.summary ?? [];
  const rems = data?.remittances ?? MOCK_REM;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">COD ledger</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Track cash-on-delivery collected and owed to you</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Wallet}        label="Total collected" value={`रु ${sum.totalCollected.toLocaleString()}`} color="rose"  />
        <StatCard icon={ArrowDownLeft} label="Remitted"        value={`रु ${sum.remitted.toLocaleString()}`}       color="green" />
        <StatCard icon={Clock}         label="Pending payout"  value={`रु ${sum.pending.toLocaleString()}`}        color="amber" />
        <StatCard icon={AlertTriangle} label="In dispute"      value={`रु ${sum.inDispute.toLocaleString()}`}      color="red"   />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-white">Remittance history</h2></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-800">
              {['Date','Ref','Amount','Method','Status'].map(h=><th key={h} className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {rems.map(r=>(
                <tr key={r.ref} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 text-xs text-zinc-400">{r.date}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{r.ref}</td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-200">रु {r.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{r.method}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${r.status==='SETTLED'?'bg-green-500/10 text-green-400':'bg-amber-500/10 text-amber-400'}`}>
                      {r.status==='SETTLED'?'Settled':'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-white">COD by shipment</h2></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-800">
              {['Tracking','Receiver','COD','Collected'].map(h=><th key={h} className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {MOCK_COD.map(s=>(
                <tr key={s.trackingNumber} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{s.trackingNumber}</td>
                  <td className="px-4 py-3 text-xs text-zinc-300">{s.receiverName}</td>
                  <td className="px-4 py-3 text-xs font-medium text-zinc-200">रु {s.codAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">{s.collectedAt?<span className="text-green-400">{s.collectedAt}</span>:<span className="text-amber-400">Awaiting</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}