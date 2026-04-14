import { AlertOctagon, Clock, Zap, Phone } from 'lucide-react';
import { useStuckPackages } from '../hooks/useDispatcher';

function urgencyColor(hrs) {
  if (hrs >= 36) return { dot: 'bg-red-500',    text: 'text-red-400',    bg: 'bg-red-500/10'    };
  if (hrs >= 24) return { dot: 'bg-amber-500',  text: 'text-amber-400',  bg: 'bg-amber-500/10'  };
  return               { dot: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10' };
}

function hoursInHub(shipment) {
  const ref = shipment.arrivedAt ?? shipment.updatedAt ?? shipment.createdAt;
  if (!ref) return 0;
  return Math.round((Date.now() - new Date(ref).getTime()) / 3_600_000);
}

export default function StuckPackages() {
  const { data, loading, error } = useStuckPackages();

  const raw      = data?.shipments ?? [];
  const packages = raw.map(s => ({
    id:              s.id,
    trackingNumber:  s.trackingNumber,
    merchant:        s.merchant?.businessName ?? s.merchant?.fullName ?? '—',
    destination:     s.deliveryAddress ?? '—',
    hoursInHub:      hoursInHub(s),
    weight:          s.weight ?? null,
    merchantPhone:   s.merchant?.phoneNumber ?? null,
    reason:          s.stuckReason ?? 'Pending review',
  }));

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Stuck packages</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Packages in hub for more than 24 hours</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-700/40 rounded-xl p-3 mb-4 text-sm text-red-400">
          Failed to load: {error}
        </div>
      )}

      {!loading && packages.length > 0 && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-700/30 rounded-xl p-4 mb-5">
          <AlertOctagon size={18} className="text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-300">
              {packages.length} package{packages.length !== 1 ? 's' : ''} require immediate attention
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">These packages have exceeded the 24-hour hub dwell limit</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center text-zinc-600 text-sm">
          No stuck packages 🎉
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map(pkg => {
            const c = urgencyColor(pkg.hoursInHub);
            return (
              <div
                key={pkg.id ?? pkg.trackingNumber}
                className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 border-l-4 ${
                  pkg.hoursInHub >= 36 ? 'border-l-red-500' : 'border-l-amber-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 px-3 py-2 rounded-lg text-center ${c.bg}`}>
                    <div className={`text-xl font-bold ${c.text}`}>{pkg.hoursInHub}</div>
                    <div className={`text-xs ${c.text} opacity-80`}>hours</div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs text-zinc-500">{pkg.trackingNumber}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                      <span className={`text-xs font-medium ${c.text}`}>
                        {pkg.hoursInHub >= 36 ? 'Critical' : pkg.hoursInHub >= 30 ? 'High priority' : 'Needs attention'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-zinc-200 mb-0.5">
                      {pkg.merchant} → {pkg.destination}
                    </p>
                    <p className="text-xs text-zinc-500 mb-2">
                      {pkg.weight != null ? `${pkg.weight} kg · ` : ''}{pkg.reason}
                    </p>

                    <div className="flex gap-2 flex-wrap">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-medium transition-all">
                        <Zap size={11} /> Force assign
                      </button>
                      
                      {/* FIXED ANCHOR TAG BELOW */}
                      {pkg.merchantPhone && (
                        <a
                          href={`tel:${pkg.merchantPhone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs rounded-lg transition-all"
                        >
                          <Phone size={11} /> Call merchant
                        </a>
                      )}

                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs rounded-lg transition-all">
                        <Clock size={11} /> Escalate to admin
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}