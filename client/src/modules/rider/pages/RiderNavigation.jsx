import { useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Navigation } from "lucide-react";
import { NavMap } from "../components/navigation/NavMap";
import { CurrentStop } from "../components/navigation/CurrentStop";
import { UpcomingStops } from "../components/navigation/UpcomingStops";
import { useRiderManifest } from "../hooks/useRider";
import { openNavigation, getShipmentDestination } from "../../../shared/utils/navigation";

export default function RiderNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const stop = location.state?.stop ?? null;
  const { data: manifestData, refetch } = useRiderManifest();

  const manifestList = useMemo(
    () => (Array.isArray(manifestData) ? manifestData : []),
    [manifestData]
  );

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refetch]);

  const mergedStop = useMemo(() => {
    if (!stop?.id) return stop;
    const fresh = manifestList.find((s) => s.id === stop.id);
    return fresh ?? stop;
  }, [manifestList, stop]);

  const upcomingStops = useMemo(() => {
    if (!mergedStop?.id || manifestList.length === 0) return [];
    const idx = manifestList.findIndex((s) => s.id === mergedStop.id);
    if (idx < 0) return [];
    return manifestList.slice(idx + 1).filter((s) => s.status !== "DELIVERED");
  }, [manifestList, mergedStop?.id]);

  if (!stop) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-3 mt-20">
        <p className="text-zinc-400 text-sm">No stop selected.</p>
        <button
          onClick={() => navigate("/rider/manifest")}
          className="text-sky-400 text-sm hover:underline"
        >
          Back to manifest
        </button>
      </div>
    );
  }

  const dest = getShipmentDestination(mergedStop);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-400 transition-all"
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white">
            {mergedStop.status === "AWAITING_PICKUP"
              ? "Go collect"
              : mergedStop.status === "PICKED_UP"
                ? "Return to hub"
                : "Deliver"}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {mergedStop.status === "AWAITING_PICKUP"
              ? `Pickup from ${mergedStop.merchant?.businessName}`
              : mergedStop.status === "PICKED_UP"
                ? `${mergedStop.trackingNumber} · dispatcher scans at hub`
                : `Deliver to ${mergedStop.receiverName}`}
          </p>
        </div>
      </div>

      {/* Map with route */}
      <NavMap stop={mergedStop} />

      {/* Stop detail */}
      <CurrentStop stop={mergedStop} dest={dest} />

      <UpcomingStops stops={upcomingStops} manifest={manifestList} />

      {/* Open in external maps */}
      <button
        type="button"
        onClick={() => openNavigation(dest)}
        disabled={dest.lat == null || dest.lng == null}
        className="w-full flex items-center justify-center gap-2 py-3 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-sm rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none"
      >
        <Navigation size={14} />
        Open in Google Maps / Apple Maps
      </button>
    </div>
  );
}