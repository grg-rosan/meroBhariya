import { Package, TrendingUp, Wallet, AlertCircle, RefreshCw } from 'lucide-react';
import { useMerchantDashboard, useShipments } from '../hooks/useMerchant';
import StatusBadge from '../../shared/components/StatusBadge';

function StatCard({ icon: Icon, label, value, sub, color = 'rose' }) {
  const colors = {
    rose:  'bg-rose-500/10 text-rose-400',
    green: 'bg-green-500/10 text-green-400',
    amber: 'bg-amber-500/10 text-amber-400',
    red:   'bg-red-500/10 text-red-400',
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={15} />
        </div>
      </div>
      <div className="text-2xl font-semibold text-white">{value ?? '—'}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

function ProgressBar({ label, value, max = 100 }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300 font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-rose-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Mock data used when API isn't connected yet
const MOCK_STATS = {
  activeShipments: 47,
  deliveredToday: 23,
  codPending: 84200,
  failedToday: 3,
  successRates: { week: 87, month: 91, allTime: 89 },
};

const MOCK_RECENT = [
  { id: 'PTR-2841', receiverName: 'Aarav Shah',   deliveryAddress: 'Thamel, KTM',  status: 'DELIVERED' },
  { id: 'PTR-2840', receiverName: 'Priya Thapa',  deliveryAddress: 'Lalitpur-3',   status: 'OUT_FOR_DELIVERY' },
  { id: 'PTR-2839', receiverName: 'Raj Gurung',   deliveryAddress: 'Bhaktapur',    status: 'PENDING' },
  { id: 'PTR-2838', receiverName: 'Sita Rai',     deliveryAddress: 'Patan-7',      status: 'IN_HUB' },
  { id: 'PTR-2837', receiverName: 'Manish KC',    deliveryAddress: 'Koteshwor',    status: 'CANCELLED' },
];

export default function MerchantDashboard() {
  const { data: stats, loading: sLoading, refetch } = useMerchantDashboard();
  const { data: shipmentsRes, loading: shLoading }  = useShipments('', 1);

  const s        = stats ?? MOCK_STATS;
  const recent   = shipmentsRes?.shipments ?? MOCK_RECENT;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Welcome back, Himalayan Traders</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-all"
        >
          <RefreshCw size={12} className={sLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Package}      label="Active shipments" value={s.activeShipments}               color="rose" />
        <StatCard icon={TrendingUp}   label="Delivered today"  value={s.deliveredToday}                color="green" />
        <StatCard icon={Wallet}       label="COD pending"      value={`रु ${s.codPending?.toLocaleString()}`} color="amber" />
        <StatCard icon={AlertCircle}  label="Failed today"     value={s.failedToday}                   color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent shipments */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white">Recent shipments</h2>
            <a href="/merchant/shipments" className="text-xs text-rose-400 hover:text-rose-300 transition-colors">
              View all →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-5 py-2.5 text-xs text-zinc-500 font-medium">Tracking</th>
                  <th className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium">Receiver</th>
                  <th className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium">Address</th>
                  <th className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(shLoading ? MOCK_RECENT : recent).map((s) => (
                  <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3 text-xs font-mono text-zinc-400">{s.id || s.trackingNumber}</td>
                    <td className="px-4 py-3 text-sm text-zinc-200">{s.receiverName}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{s.deliveryAddress}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Success rates */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Delivery success rate</h2>
          <ProgressBar label="This week"  value={s.successRates?.week    ?? 87} />
          <ProgressBar label="This month" value={s.successRates?.month   ?? 91} />
          <ProgressBar label="All time"   value={s.successRates?.allTime ?? 89} />
          <div className="mt-5 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-xl font-semibold text-white">{s.deliveredToday}</div>
              <div className="text-xs text-zinc-500 mt-0.5">Delivered today</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-rose-400">{s.failedToday}</div>
              <div className="text-xs text-zinc-500 mt-0.5">Failed today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}