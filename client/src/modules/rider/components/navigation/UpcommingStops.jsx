// src/rider/components/navigation/UpcomingStops.jsx

import { UpcomingStopRow } from "./UpcommingStopRow";
export function UpcomingStops({ stops }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-200 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-white">Upcoming stops</h2>
      </div>
      {stops.map((stop) => (
        <UpcomingStopRow key={stop.trackingNumber} stop={stop} />
      ))}
    </div>
  );
}
