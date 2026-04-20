// src/rider/pages/RiderNavigation.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';                              // ← was missing
import { useRiderNavigation } from '../hooks/useRiderNavigation';
import { NavMap } from '../components/navigation/NavMap';
import { CurrentStop } from '../components/navigation/CurrentStop';
import { UpcomingStops } from '../components/navigation/UpcommingStops';
export default function RiderNavigation() {
  const location   = useLocation();
  const navigate   = useNavigate();
  const activeStop = location.state?.stop ?? null;

  const { current, upcoming, totalStops } = useRiderNavigation(
    activeStop ? [activeStop] : []
  );

  if (!activeStop) {
    return (
      <div className="p-6 max-w-3xl mx-auto flex flex-col items-center justify-center gap-3 mt-20">
        <p className="text-zinc-400 text-sm">No stop selected.</p>
        <button
          onClick={() => navigate('/rider/manifest')}
          className="text-sky-400 text-sm hover:underline"
        >
          Back to manifest
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-400 transition-all"
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white">Route navigation</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Stop {activeStop.stopNum} of {totalStops + 2}
          </p>
        </div>
      </div>

      {/* NavMap owns containerRef + useMapLibre internally */}
      <NavMap stops={[current, ...upcoming].filter(Boolean)} />

      {current && <CurrentStop stop={current} stopCount={totalStops + 2} />}
      {upcoming.length > 0 && <UpcomingStops stops={upcoming} />}
    </div>
  );
}