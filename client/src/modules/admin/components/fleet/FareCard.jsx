import { useState } from "react";
import { Save, Pencil } from "lucide-react";
import FareField from "./FareField";


const FIELDS = [
  { key: "baseFare", label: "Base fare (रु)", step: "1" },
  { key: "perKmRate", label: "Per km (रु)", step: "0.5" },
  { key: "perKgRate", label: "Per kg (रु)", step: "0.5" },
  { key: "minFare", label: "Min fare (रु)", step: "1" },
  { key: "fragileCharge", label: "Fragile charge (रु)", step: "1" },
  { key: "codChargeRate", label: "COD charge (%)", step: "0.1" },
  { key: "nightSurcharge", label: "Night surcharge (रु)", step: "1" },
  { key: "cancelCharge", label: "Cancel fee (रु)", step: "1" },
];

export default function FareCard({ config, onSave, saving }) {
  const [form, setForm] = useState({ ...config });
  const [dirty, setDirty] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: parseFloat(val) || 0 }));
    setDirty(true);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden mb-4 last:mb-0">
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-100 dark:bg-blue-950/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
            <span className="text-xs font-bold">{config.name?.[0]}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">
              {config.vehicleType.name}
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Max {config.vehicleType.maxWeightKg} kg · Base रु {form.baseFare}{" "}
              · {form.perKmRate} रु/km
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              Unsaved
            </span>
          )}
          <Pencil size={13} className="text-gray-400 dark:text-zinc-500" />
        </div>
      </button>

      {/* Expanded fields */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-200 dark:border-zinc-800">
          // replace the FIELDS.map block with:
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {FIELDS.map((f) => (
              <FareField
                key={f.key}
                label={f.label}
                step={f.step}
                value={form[f.key]}
                onChange={(val) => set(f.key, val)}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                onSave(config.vehicleTypeId, form);
                setDirty(false);
              }}
              disabled={saving || !dirty}
              className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all"
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
