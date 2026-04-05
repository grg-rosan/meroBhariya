import { Package, TrendingUp, Wallet, AlertCircle, RefreshCw } from 'lucide-react';
import { useMerchantDashboard, useShipments } from '../hooks/useMerchant';
import StatCard from '../../shared/components/StatCard';
import StatusBadge from '../../shared/components/StatusBadge';

const MOCK_STATS = { activeShipments: 47, deliveredToday: 23, codPending: 84200, failedToday: 3, week: 87, month: 91, allTime: 89 };
const MOCK_RECENT = [
  { trackingNumber:'PTR-2841', receiverName:'Aarav Shah',   deliveryAddress:'Thamel, KTM',  status:'DELIVERED' },
  { trackingNumber:'PTR-2840', receiverName:'Priya Thapa',  deliveryAddress:'Lalitpur-3',   status:'OUT_FOR_DELIVERY' },
  { trackingNumber:'PTR-2839', receiverName:'Raj Gurung',   deliveryAddress:'Bhaktapur',    status:'PENDING' },
  { trackingNumber:'PTR-2838', receiverName:'Sita Rai',     deliveryAddress:'Patan-7',      status:'IN_HUB' },
  { trackingNumber:'PTR-2837', receiverName:'Manish KC',    deliveryAddress:'Koteshwor',    status:'CANCELLED' },
];

function Bar({ label, pct }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300 font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function MerchantDashboard() {
  const { data: stats, loading, refetch } = useMerchantDashboard();
  const { data: shipmentsRes }            = useShipments();
  const s      = stats ?? MOCK_STATS;
  const recent = shipmentsRes?.shipments ?? MOCK_RECENT;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Welcome back, Himalayan Traders</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-all">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Package}     label="Active shipments" value={s.activeShipments}                        color="rose"  />
        <StatCard icon={TrendingUp}  label="Delivered today"  value={s.deliveredToday}                         color="green" />
        <StatCard icon={Wallet}      label="COD pending"      value={`रु ${s.codPending?.toLocaleString()}`}   color="amber" />
        <StatCard icon={AlertCircle} label="Failed today"     value={s.failedToday}                            color="red"   />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Recent shipments</h2>
            <a href="/merchant/shipments" className="text-xs text-rose-400 hover:text-rose-300">View all →</a>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-800">
              {['Tracking','Receiver','Address','Status'].map(h=><th key={h} className="text-left px-5 py-2.5 text-xs text-zinc-500 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {recent.map(s=>(
                <tr key={s.trackingNumber} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3 text-xs font-mono text-zinc-400">{s.trackingNumber}</td>
                  <td className="px-4 py-3 text-sm text-zinc-200">{s.receiverName}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{s.deliveryAddress}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Delivery success rate</h2>
          <Bar label="This week"  pct={s.week    ?? 87} />
          <Bar label="This month" pct={s.month   ?? 91} />
          <Bar label="All time"   pct={s.allTime ?? 89} />
          <div className="mt-5 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-3 text-center">
            <div><div className="text-xl font-semibold text-white">{s.deliveredToday}</div><div className="text-xs text-zinc-500 mt-0.5">Delivered</div></div>
            <div><div className="text-xl font-semibold text-rose-400">{s.failedToday}</div><div className="text-xs text-zinc-500 mt-0.5">Failed</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}