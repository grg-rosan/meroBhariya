import { Banknote, TrendingUp, Package, Star } from 'lucide-react';
import { useRiderEarnings } from '../hooks/useRider';
import StatCard from '../../shared/components/StatCard';

const MOCK = { week:6840, month:24200, pending:1240, totalDrops:342 };
const PAYOUTS = [
  { date:'10 Apr', drops:28, amount:5600, status:'PAID' },
  { date:'3 Apr',  drops:31, amount:6200, status:'PAID' },
  { date:'27 Mar', drops:26, amount:5200, status:'PAID' },
  { date:'20 Mar', drops:29, amount:5800, status:'PAID' },
];
const BREAKDOWN = [
  { label:'Base delivery fee',  amount:820 },
  { label:'COD handling bonus', amount:280 },
  { label:'Night surcharge',    amount:90 },
  { label:'Deductions',         amount:-50 },
];

export default function RiderEarnings() {
  const { data } = useRiderEarnings();
  const s = data ?? MOCK;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Earnings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Your income and payout history</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Banknote}    label="This week"   value={`रु ${s.week?.toLocaleString()}`}    color="green" />
        <StatCard icon={TrendingUp}  label="This month"  value={`रु ${s.month?.toLocaleString()}`}   color="sky"   />
        <StatCard icon={Banknote}    label="Pending"     value={`रु ${s.pending?.toLocaleString()}`} color="amber" />
        <StatCard icon={Package}     label="Total drops" value={s.totalDrops}                         color="blue"  />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Payout history */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800"><h2 className="text-sm font-medium text-white">Payout history</h2></div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-800">
              {['Date','Drops','Amount','Status'].map(h=><th key={h} className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {PAYOUTS.map(p=>(
                <tr key={p.date} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 text-xs text-zinc-400">{p.date}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{p.drops}</td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-200">रु {p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded">Paid</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Today's breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-white mb-4">Today's breakdown</h2>
          {BREAKDOWN.map(b=>(
            <div key={b.label} className="flex justify-between items-center py-2.5 border-b border-zinc-800/50 last:border-none">
              <span className="text-sm text-zinc-400">{b.label}</span>
              <span className={`text-sm font-medium ${b.amount<0?'text-red-400':'text-zinc-200'}`}>
                {b.amount<0?'-':'+'}रु {Math.abs(b.amount)}
              </span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-zinc-700 flex justify-between">
            <span className="text-sm font-medium text-zinc-300">Total today</span>
            <span className="text-lg font-semibold text-green-400">रु {s.pending?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}