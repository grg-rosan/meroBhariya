// src/modules/merchant/components/shipment/components/VehicleSection.jsx
import { ChevronRight } from "lucide-react";

const VEHICLE_TYPES = [
  { id: 1, label: "Bike",        sub: "up to 20 kg",   icon: "🏍️" },
  { id: 2, label: "Mini Truck",  sub: "up to 500 kg",  icon: "🚐" },
  { id: 3, label: "Covered Van", sub: "up to 1500 kg", icon: "🚚" },
];

/**
 * @param {{
 *   vehicleTypeId: number,
 *   onChange: (key: string, value: any) => void,
 * }} props
 */
export default function VehicleSection({ vehicleTypeId, onChange }) {
  return (
    <div className="space-y-2">
      {VEHICLE_TYPES.map((v) => (
        <button
          key={v.id}
          onClick={() => onChange("vehicleTypeId", v.id)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all
            ${vehicleTypeId === v.id
              ? "border-rose-500 bg-rose-500/8 dark:bg-rose-500/10"
              : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
        >
          <span className="text-lg">{v.icon}</span>
          <div className="flex-1">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{v.label}</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-2">{v.sub}</span>
          </div>
          {vehicleTypeId === v.id && <ChevronRight size={14} className="text-rose-400" />}
        </button>
      ))}
    </div>
  );
}