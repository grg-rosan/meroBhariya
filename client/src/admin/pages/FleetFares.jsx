// src/admin/pages/FleetFares.jsx
import { useState } from 'react';
import { Save, Plus, Pencil } from 'lucide-react';
import { useFareConfigs, useUpsertFare } from '../hooks/useAdmin';

const FIELDS = [
  { key: 'baseFare',       label: 'Base fare (रु)',      step: '1'   },
  { key: 'perKmRate',      label: 'Per km (रु)',         step: '0.5' },
  { key: 'perKgRate',      label: 'Per kg (रु)',         step: '0.5' },
  { key: 'minFare',        label: 'Min fare (रु)',       step: '1'   },
  { key: 'fragileCharge',  label: 'Fragile charge (रु)', step: '1'   },
  { key: 'codChargeRate',  label: 'COD charge (%)',      step: '0.1' },
  { key: 'nightSurcharge', label: 'Night surcharge (रु)',step: '1'   },
  { key: 'cancelCharge',   label: 'Cancel fee (रु)',     step: '1'   },
];

function FareCard({ config, onSave, saving }) {
  const [form, setForm]         = useState({ ...config });
  const [dirty, setDirty]       = useState(false);
  const [expanded, setExpanded] = useState(false);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: parseFloat(val) || 0 }));
    setDirty(true);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-4 last:mb-0">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
            <span className="text-xs font-bold">{config.name?.[0]}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">{config.vehicleType.name}</p>
            <p className="text-xs text-zinc-500">
              Max {config.vehicleType.maxWeightKg} kg · Base रु {form.baseFare} · {form.perKmRate} रु/km
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Unsaved</span>}
          <Pencil size={13} className="text-zinc-500" />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-zinc-800">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="text-xs text-zinc-500 block mb-1.5">{f.label}</label>
                <input
                  type="number"
                  step={f.step}
                  value={form[f.key] ?? 0}
                  onChange={e => set(f.key, e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-violet-500"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => { onSave(config.vehicleTypeId, form); setDirty(false); }}
              disabled={saving || !dirty}
              className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all"
            >
              <Save size={13} />
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FleetFares() {
  const { data, loading }         = useFareConfigs();      // ✅ GET all fare configs
  const { upsert, loading: saving } = useUpsertFare();     // ✅ PUT to update
console.log('fare configs data:', data);

  // backend returns array directly or wrapped in { configs: [...] }
  const configs = Array.isArray(data) ? data : (data?.configs ?? []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Fleet & fare config</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Set per-km, per-kg, and surcharge rates per vehicle type</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-sm rounded-lg font-medium transition-all">
          <Plus size={14} /> Add vehicle type
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 text-xs text-zinc-500">
        <strong className="text-zinc-400">Fare formula: </strong>
        Base fare + (distance × per km rate) + (weight × per kg rate) + fragile charge + COD charge (% of COD amount). Night surcharge added 9 PM – 6 AM.
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : configs.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center text-zinc-600 text-sm">
          No fare configs found. Add a vehicle type to get started.
        </div>
      ) : (
        configs.map(c => (
          <FareCard key={c.vehicleTypeId ?? c.id} config={c} onSave={upsert} saving={saving} />
        ))
      )}
    </div>
  );
}