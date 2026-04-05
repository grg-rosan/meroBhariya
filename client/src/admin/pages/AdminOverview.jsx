import { Users, Bike, Package, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAdminOverview } from '../hooks/useAdmin';
import StatCard from '../../shared/components/StatCard';

const MOCK = {
  activeMerchants: 184, activeRiders: 62,
  shipmentsToday: 847,  codHeld: 420000,
  successRate: 91.4,    riderAvailability: 72,
  pendingMerchants: 12, pendingRiders: 8, expiredDocs: 3,
};

const RECENT_ACTIVITY = [
  { time: '2m ago',  text: 'Nepal Mart approved by Admin',          type: 'success' },
  { time: '14m ago', text: 'Rider Bikash Tamang went online',       type: 'info' },
  { time: '31m ago', text: 'COD settlement of रु 84,200 triggered', type: 'warning' },
  { time: '1h ago',  text: 'Rider license expired — Sunil Magar',   type: 'error' },
  { time: '2h ago',  text: '52 bulk shipments created by Himalayan Traders', type: 'info' },
];

const DOT = { success:'bg-green-500', info:'bg-sky-500', warning:'bg-amber-500', error:'bg-red-500' };

function Bar({ label, pct, color = 'bg-violet-500' }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300 font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const { data, loading } = useAdminOverview();
  const s = data ?? MOCK;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Platform overview</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Porter logistics — live health dashboard</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users}     label="Active merchants"  value={s.activeMerchants}                         color="violet" />
        <StatCard icon={Bike}      label="Active riders"     value={s.activeRiders}                            color="sky"    />
        <StatCard icon={Package}   label="Shipments today"   value={s.shipmentsToday}                          color="blue"   />
        <StatCard icon={Wallet}    label="COD held"          value={`रु ${(s.codHeld/100000).toFixed(1)}L`}   color="amber"  />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Platform health */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Platform health</h2>
          <Bar label="Delivery success rate" pct={s.successRate}       color="bg-green-500" />
          <Bar label="Rider availability"    pct={s.riderAvailability} color="bg-violet-500" />

          <div className="mt-5 pt-4 border-t border-zinc-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Pending verifications</span>
              <div className="flex gap-2">
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
                  {s.pendingMerchants} merchants
                </span>
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
                  {s.pendingRiders} riders
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Expired documents</span>
              <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded">
                {s.expiredDocs} expired
              </span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Quick actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Review pending merchants', count: s.pendingMerchants, to: '/admin/verify', color: 'text-violet-400' },
              { label: 'Review pending riders',    count: s.pendingRiders,    to: '/admin/verify', color: 'text-sky-400' },
              { label: 'Settle pending COD',       count: null,               to: '/admin/settlements', color: 'text-amber-400' },
              { label: 'Update fare configs',      count: null,               to: '/admin/fleet',       color: 'text-green-400' },
            ].map(a => (
              <a key={a.label} href={a.to}
                className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-all group">
                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{a.label}</span>
                {a.count != null && (
                  <span className={`text-xs font-semibold ${a.color}`}>{a.count}</span>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Recent activity</h2>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${DOT[a.type]}`} />
                <div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{a.text}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}