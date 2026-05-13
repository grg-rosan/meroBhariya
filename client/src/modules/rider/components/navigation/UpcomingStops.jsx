import { UpcomingStopRow } from "./UpcomingStopRow";

export function UpcomingStops({ stops, manifest = [] }) {
  if (!stops?.length) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-200">Upcoming stops</h2>
      </div>
      {stops.map((s) => {
        const idx = manifest.findIndex((x) => x.id === s.id);
        const stopNum = idx >= 0 ? idx + 1 : undefined;
        return (
          <UpcomingStopRow
            key={s.id ?? s.trackingNumber}
            stop={s}
            stopNum={stopNum}
          />
        );
      })}
    </div>
  );
}
