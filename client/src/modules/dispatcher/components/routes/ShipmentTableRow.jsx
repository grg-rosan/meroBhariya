import { CheckSquare, Square } from "lucide-react";

export default function ShipmentTableRow({ shipment, selected, onToggle }) {
  return (
    <tr
      onClick={() => onToggle(shipment.id)}
      className={`border-b border-gray-200/50 dark:border-zinc-800/50 cursor-pointer transition-colors ${
        selected
          ? "bg-emerald-500/5"
          : "hover:bg-gray-100 dark:bg-blue-950/30"
      }`}
    >
      <td className="px-4 py-3">
        {selected ? (
          <CheckSquare size={14} className="text-emerald-400" />
        ) : (
          <Square size={14} className="text-gray-300 dark:text-zinc-600" />
        )}
      </td>
      <td className="px-3 py-3 font-mono text-xs text-gray-500 dark:text-zinc-400">
        {shipment.trackingNumber}
      </td>
      <td className="px-3 py-3 text-xs text-gray-700 dark:text-zinc-300">
        {shipment.merchant?.businessName ?? "—"}
      </td>
      <td className="px-3 py-3 text-xs text-gray-500 dark:text-zinc-400">
        {shipment.receiverName}
      </td>
      <td className="px-3 py-3 text-xs text-gray-400 dark:text-zinc-500 truncate max-w-30">
        {shipment.deliveryAddress}
      </td>
      <td className="px-3 py-3 text-xs text-gray-500 dark:text-zinc-400">
        {shipment.weight} kg
      </td>
      <td className="px-3 py-3">
        <span className="text-xs bg-gray-100 dark:bg-blue-950 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded">
          {shipment.vehicleType?.name ?? "—"}
        </span>
      </td>
    </tr>
  );
}