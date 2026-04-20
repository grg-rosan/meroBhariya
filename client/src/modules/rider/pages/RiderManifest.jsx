import { useRiderManifest } from "../hooks/useRider";
import StatusBadge from "../../../shared/components/StatusBadge";
import { Navigation, Phone } from "lucide-react";

const MOCK = [
  {
    trackingNumber: "PTR-2831",
    receiverName: "Aarav Shah",
    deliveryAddress: "Lazimpat, KTM",
    weight: 1.2,
    codAmount: 0,
    status: "DELIVERED",
    stopNum: 1,
  },
  {
    trackingNumber: "PTR-2832",
    receiverName: "Priya Thapa",
    deliveryAddress: "Baneshwor",
    weight: 0.8,
    codAmount: 2400,
    status: "DELIVERED",
    stopNum: 2,
  },
  {
    trackingNumber: "PTR-2840",
    receiverName: "Raj Gurung",
    deliveryAddress: "Koteshwor",
    weight: 2.1,
    codAmount: 1800,
    status: "ASSIGNED",
    stopNum: 3,
  },
  {
    trackingNumber: "PTR-2841",
    receiverName: "Sita Rai",
    deliveryAddress: "Patan Dhoka",
    weight: 0.5,
    codAmount: 900,
    status: "PENDING",
    stopNum: 4,
  },
  {
    trackingNumber: "PTR-2842",
    receiverName: "Manish KC",
    deliveryAddress: "Jawalakhel",
    weight: 1.8,
    codAmount: 0,
    status: "PENDING",
    stopNum: 5,
  },
  {
    trackingNumber: "PTR-2843",
    receiverName: "Deepa Magar",
    deliveryAddress: "Naxal, KTM",
    weight: 0.6,
    codAmount: 1500,
    status: "PENDING",
    stopNum: 6,
  },
];

export default function RiderManifest() {
  const { data, loading } = useRiderManifest();
  const stops = data?.stops ?? MOCK;
  const done = stops.filter((s) => s.status === "DELIVERED").length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Today's manifest</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {stops.length} drops assigned · {done} completed
          </p>
        </div>
        <button className="text-xs text-zinc-400 border border-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-all">
          Export PDF
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-zinc-400">Progress</span>
          <span className="text-zinc-300 font-medium">
            {done} / {stops.length}
          </span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 rounded-full transition-all"
            style={{ width: `${(done / stops.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {stops.map((stop, i) => {
          const isDone = stop.status === "DELIVERED";
          const isCurrent =
            !isDone && stops.findIndex((s) => s.status !== "DELIVERED") === i;
          return (
            <div
              key={stop.trackingNumber}
              className={`flex items-center gap-4 p-4 border-b border-zinc-800/50 last:border-none ${isCurrent ? "bg-sky-500/5" : ""}`}
            >
              {/* Stop number */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${isDone ? "bg-green-500/20 text-green-400" : isCurrent ? "bg-sky-500 text-white" : "bg-zinc-800 text-zinc-400"}`}
              >
                {stop.stopNum}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-200">
                    {stop.receiverName}
                  </p>
                  {stop.codAmount > 0 && (
                    <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                      COD रु {stop.codAmount.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {stop.trackingNumber} · {stop.deliveryAddress} · {stop.weight}{" "}
                  kg
                </p>
              </div>
              {/* Actions */}
              <div className="shrink-0">
                {isDone ? (
                  <StatusBadge status="DELIVERED" />
                ) : isCurrent ? (
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs rounded-lg font-medium transition-all">
                      <Navigation size={12} />
                      Navigate
                    </button>
                    <button className="p-1.5 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all">
                      <Phone size={13} />
                    </button>
                  </div>
                ) : (
                  <StatusBadge status="PENDING" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
