import Badge from "../shared/Badge";
import { useThemeTokens } from "../../../../shared/hooks/useTheme.js";

/**
 * ShipmentCard
 * Card in the PickupQueue grid. Fully self-contained display unit.
 *
 * Props
 * ─────
 * shipment   {object}
 * dark       {boolean}
 * checked    {boolean}
 * onCheck    {fn}  (id, checked) => void
 * onAssign   {fn}  (shipment) => void   – opens SingleAssignModal
 */
export default function ShipmentCard({
  shipment,
  dark,
  checked,
  onCheck,
  onAssign,
}) {
  const tk = useThemeTokens(dark);

  const time = new Date(shipment.createdAt).toLocaleTimeString("en-NP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`${tk.card(checked)} rounded-xl p-4 space-y-3 transition-colors`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheck(shipment.id, e.target.checked)}
            className="mt-0.5 accent-violet-500 w-4 h-4 cursor-pointer"
          />
          <div>
            <p className={`${tk.text} font-mono text-sm font-semibold`}>
              {shipment.trackingNumber}
            </p>
            <p className={`${tk.accent} text-sm font-medium mt-0.5`}>
              {shipment.merchant?.businessName}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge label={shipment.vehicleType?.name} className={tk.tag} />
          {shipment.isFragile && (
            <Badge label="Fragile" className="bg-amber-500/20 text-amber-400" />
          )}
        </div>
      </div>

      {/* Details */}
      <div className={`text-xs ${tk.sub} space-y-1`}>
        <p className="flex gap-2">
          <span className={tk.muted}>To</span>
          <span
            className={`${dark ? "text-zinc-300" : "text-zinc-700"} truncate`}
          >
            {shipment.deliveryAddress}
          </span>
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <span className={tk.muted}>Zone </span>
            <span className={dark ? "text-zinc-300" : "text-zinc-700"}>
              {shipment.zone?.name}
            </span>
          </span>
          <span>
            <span className={tk.muted}>Wt </span>
            <span className={dark ? "text-zinc-300" : "text-zinc-700"}>
              {shipment.weight} kg
            </span>
          </span>
          <span>
            {shipment.paymentType === "COD" ? (
              <span className="text-emerald-500">
                COD रू {shipment.codAmount}
              </span>
            ) : (
              <span className="text-blue-500">Prepaid</span>
            )}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <span className={tk.muted}>From </span>
            <span className={dark ? "text-zinc-300" : "text-zinc-700"}>
              {shipment.fromDistrict?.name}
            </span>
          </span>
          <span>
            <span className={tk.muted}>To </span>
            <span className={dark ? "text-zinc-300" : "text-zinc-700"}>
              {shipment.toDistrict?.name}
            </span>
          </span>
          <span className={`ml-auto ${tk.muted}`}>{time}</span>
        </div>
      </div>

      <button
        onClick={() => onAssign(shipment)}
        className={`w-full py-2 rounded-lg ${tk.btnBase} text-sm font-medium transition-colors`}
      >
        Assign Rider →
      </button>
    </div>
  );
}
