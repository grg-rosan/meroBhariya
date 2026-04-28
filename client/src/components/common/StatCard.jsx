const COLORS = {
  rose:   'bg-rose-500/10 text-rose-400',
  green:  'bg-green-500/10 text-green-400',
  amber:  'bg-amber-500/10 text-amber-400',
  red:    'bg-red-500/10 text-red-400',
  blue:   'bg-blue-500/10 text-blue-400',
  purple: 'bg-purple-500/10 text-purple-400',
  sky:    'bg-sky-500/10 text-sky-400',
};

export default function StatCard({ icon: Icon, label, value, sub, color = 'rose' }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${COLORS[color]}`}>
            <Icon size={14} />
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold text-white">{value ?? '—'}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}