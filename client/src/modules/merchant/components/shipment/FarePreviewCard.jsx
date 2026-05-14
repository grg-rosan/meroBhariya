// src/modules/merchant/components/shipment/components/FarePreviewCard.jsx
import { Loader2, AlertCircle } from "lucide-react";

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-5 shadow-sm ${className}`}>
    {children}
  </div>
);

/**
 * @param {{
 *   fareData: object | null,
 *   loading: boolean,
 *   error: string | null,
 * }} props
 */
export default function FarePreviewCard({ fareData, loading, error }) {
  if (!fareData && !loading && !error) return null;

  const rows = fareData
    ? [
        { label: "Distance",        value: `${fareData.distanceKm} km` },
        { label: "Zone",            value: fareData.zone },
        { label: "Base fare",       value: `रु ${fareData.baseFare}` },
        { label: "Distance charge", value: `रु ${fareData.distanceFare}` },
        { label: "Weight charge",   value: `रु ${fareData.weightFare}` },
        ...(fareData.fragileCharge > 0 ? [{ label: "Fragile",        value: `रु ${fareData.fragileCharge}` }] : []),
        ...(fareData.zoneSurcharge  > 0 ? [{ label: "Zone surcharge", value: `रु ${fareData.zoneSurcharge}` }] : []),
        ...(fareData.codFee         > 0 ? [{ label: "COD fee",        value: `रु ${fareData.codFee}` }] : []),
      ]
    : [];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-200">Fare estimate</h2>
        {loading && <Loader2 size={13} className="text-gray-400 animate-spin" />}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 mb-3">
          <AlertCircle size={12} /> {error}
        </div>
      )}

      {loading && !fareData && (
        <div className="flex justify-center py-6">
          <Loader2 size={18} className="animate-spin text-gray-300 dark:text-zinc-600" />
        </div>
      )}

      {fareData && (
        <>
          <div className="space-y-2 mb-4">
            {rows.map((r) => (
              <div key={r.label} className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-zinc-500">{r.label}</span>
                <span className="text-gray-800 dark:text-zinc-200 font-medium">{r.value}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-zinc-700 pt-3 flex justify-between items-baseline">
            <span className="text-sm text-gray-600 dark:text-zinc-400">Total fare</span>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              रु {Number(fareData.totalFare).toLocaleString()}
            </span>
          </div>
        </>
      )}
    </Card>
  );
}