import { Phone, Store, User, Warehouse } from "lucide-react";

export function CurrentStop({ stop, dest }) {
  const isPickup    = stop.status === "AWAITING_PICKUP";
  const isHubReturn = stop.status === "PICKED_UP";
  const phone       = isPickup
    ? stop.merchant?.user?.phoneNumber
    : stop.receiverPhone;

  return (
    <div className={`border rounded-xl p-5 space-y-3 ${
      isPickup
        ? "bg-violet-500/10 border-violet-500/30"
        : isHubReturn
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-sky-500/10 border-sky-500/30"
    }`}>

      {/* Label */}
      <span className={`text-xs font-medium uppercase tracking-wider ${
        isPickup ? "text-violet-400" : isHubReturn ? "text-amber-400" : "text-sky-400"
      }`}>
        {isPickup ? "Pickup stop" : isHubReturn ? "Hub drop-off" : "Delivery stop"}
      </span>

      {/* Name + address */}
      <div className="flex items-start gap-2">
        {isPickup
          ? <Store size={15} className="text-violet-400 mt-0.5 shrink-0" />
          : isHubReturn
            ? <Warehouse size={15} className="text-amber-400 mt-0.5 shrink-0" />
            : <User  size={15} className="text-sky-400 mt-0.5 shrink-0" />}
        <div>
          <h2 className="text-base font-semibold text-white">
            {isPickup ? stop.merchant?.businessName : stop.receiverName}
          </h2>
          <p className="text-sm text-zinc-400 mt-0.5">{dest.label}</p>
        </div>
      </div>

      {/* COD badge */}
      {!isHubReturn && stop.codAmount > 0 && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <span className="text-xs text-amber-400">
            Collect COD: रु {stop.codAmount.toLocaleString()}
          </span>
        </div>
      )}

      {/* Call button */}
      {!isHubReturn && phone && (
        <a
          href={`tel:${phone}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-sm rounded-lg transition-all"
        >
          <Phone size={14} />
          Call {isPickup ? "merchant" : "receiver"}
        </a>
      )}
    </div>
  );
}