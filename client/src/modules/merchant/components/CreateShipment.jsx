// src/merchant/pages/CreateShipment.jsx <<-- notice this! i have this componenet in src/merchant/components
// Full shipment creation form with:
//  - Google Places Autocomplete for both addresses
//  - Live fare preview (calls /api/shipments/fare-preview)
//  - Mini preview map showing pickup → delivery
//  - Submit creates shipment with snapped geocoords

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Loader2, ChevronRight, AlertCircle, MapPin } from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';
import { useMapLibre } from '../../../shared/hooks/useMapLibre';
import { apiPost } from '../../../shared/hooks/useApi';
const VEHICLE_TYPES = [
  { id: 1, label: 'Bike (up to 20 kg)',        icon: '🏍️' },
  { id: 2, label: 'Mini Truck (up to 500 kg)',  icon: '🚐' },
  { id: 3, label: 'Covered Van (up to 1500 kg)',icon: '🚚' },
];

const INITIAL = {
  receiverName: '', receiverPhone: '',
  deliveryAddress: '', deliveryLatLng: null,
  weightKg: '', isFragile: false,
  orderValue: '', codAmount: '',
  vehicleTypeId: 1,
};

export default function CreateShipment() {
  const navigate = useNavigate();
  const [form, setForm]         = useState(INITIAL);
  const [fareData, setFareData] = useState(null);
  const [fareLoading, setFL]    = useState(false);
  const [fareError, setFE]      = useState(null);
  const [submitting, setSub]    = useState(false);
  const [errors, setErrors]     = useState({});
  const fareTimerRef            = useRef(null);

  // Map for preview
  const mapContainerRef = useRef(null);
  const { mapRef, upsertMarker, drawRoute,} = useMapLibre(mapContainerRef, {
    center: [85.314, 27.717],
    zoom: 11,
    style: 'mapbox://styles/mapbox/dark-v11',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── Live fare preview (debounced 800ms) ──────────────────────
  const triggerFarePreview = useCallback(() => {
    clearTimeout(fareTimerRef.current);
    const { deliveryAddress, deliveryLatLng, weightKg, vehicleTypeId } = form;
    if (!deliveryLatLng || !weightKg) return;

    fareTimerRef.current = setTimeout(async () => {
      setFL(true); setFE(null);
      try {
        const data = await apiPost('/api/shipments/fare-preview', {
          pickupAddress:   'Merchant pickup address', // real app: from merchantProfile
          deliveryAddress,
          weightKg:        parseFloat(weightKg),
          isFragile:       form.isFragile,
          codAmount:       parseFloat(form.codAmount || 0),
          vehicleTypeId,
        });
        setFareData(data);

        // Update map markers and route line
        if (data.pickup && data.delivery && mapRef.current) {
          const pickupLngLat   = [data.pickup.lng,   data.pickup.lat];
          const deliveryLngLat = [data.delivery.lng, data.delivery.lat];

          upsertMarker('pickup', pickupLngLat, {
            style: 'width:12px;height:12px;border-radius:50%;background:#10b981;border:2px solid #fff',
            popup: '<div style="color:#111;font-size:12px;font-weight:500">Pickup</div>',
          });
          upsertMarker('delivery', deliveryLngLat, {
            style: 'width:12px;height:12px;border-radius:50%;background:#f43f5e;border:2px solid #fff',
            popup: '<div style="color:#111;font-size:12px;font-weight:500">Delivery</div>',
          });
          drawRoute('preview', [pickupLngLat, deliveryLngLat]);

          // Fit bounds
          const bounds = new maplibregl.LngLatBounds(pickupLngLat, deliveryLngLat);
          mapRef.current.fitBounds(bounds, { padding: 60 });
        }
      } catch (e) {
        setFE(e.message);
      } finally {
        setFL(false);
      }
    }, 800);
  }, [form, mapRef, upsertMarker, drawRoute]);

  useEffect(() => {
    triggerFarePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.deliveryLatLng, form.weightKg, form.isFragile, form.codAmount, form.vehicleTypeId]);

  // ── Validation ───────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.receiverName.trim())  e.receiverName  = 'Required';
    if (!form.receiverPhone.trim()) e.receiverPhone  = 'Required';
    if (!form.deliveryLatLng)       e.deliveryAddress = 'Select an address from the dropdown';
    if (!form.weightKg || form.weightKg <= 0) e.weightKg = 'Enter package weight';
    if (!form.orderValue || form.orderValue <= 0) e.orderValue = 'Enter order value';
    return e;
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSub(true);
    try {
      const { trackingNumber } = await apiPost('/api/shipments', {
        ...form,
        fareSnapshot: fareData?.totalFare,
      });
      navigate(`/merchant/shipments?highlight=${trackingNumber}`);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSub(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">New shipment</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Addresses are autocompleted and geocoded automatically</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-5">
          {/* Receiver */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-zinc-300 mb-4">Receiver details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Full name <span className="text-rose-400">*</span></label>
                <input value={form.receiverName} onChange={e => set('receiverName', e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-zinc-800 border rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors ${errors.receiverName ? 'border-red-500' : 'border-zinc-700 focus:border-zinc-500'}`}
                  placeholder="Aarav Shah" />
                {errors.receiverName && <p className="text-xs text-red-400 mt-1">{errors.receiverName}</p>}
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Phone <span className="text-rose-400">*</span></label>
                <input value={form.receiverPhone} onChange={e => set('receiverPhone', e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-zinc-800 border rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors ${errors.receiverPhone ? 'border-red-500' : 'border-zinc-700 focus:border-zinc-500'}`}
                  placeholder="98XXXXXXXX" />
                {errors.receiverPhone && <p className="text-xs text-red-400 mt-1">{errors.receiverPhone}</p>}
              </div>
              <AddressAutocomplete
                label="Delivery address"
                value={form.deliveryAddress}
                onChange={(addr, latLng) => { set('deliveryAddress', addr); set('deliveryLatLng', latLng); }}
                error={errors.deliveryAddress}
                required
              />
            </div>
          </div>

          {/* Package */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-zinc-300 mb-4">Package details</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Weight (kg) <span className="text-rose-400">*</span></label>
                <input type="number" min="0.1" step="0.1" value={form.weightKg} onChange={e => set('weightKg', e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-zinc-800 border rounded-lg text-zinc-200 focus:outline-none transition-colors ${errors.weightKg ? 'border-red-500' : 'border-zinc-700 focus:border-zinc-500'}`}
                  placeholder="1.5" />
                {errors.weightKg && <p className="text-xs text-red-400 mt-1">{errors.weightKg}</p>}
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Order value (रु) <span className="text-rose-400">*</span></label>
                <input type="number" min="0" value={form.orderValue} onChange={e => set('orderValue', e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-zinc-800 border rounded-lg text-zinc-200 focus:outline-none transition-colors ${errors.orderValue ? 'border-red-500' : 'border-zinc-700 focus:border-zinc-500'}`}
                  placeholder="2400" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">COD amount (रु)</label>
                <input type="number" min="0" value={form.codAmount} onChange={e => set('codAmount', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-lg text-zinc-200 focus:outline-none transition-colors"
                  placeholder="0" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="fragile" checked={form.isFragile} onChange={e => set('isFragile', e.target.checked)} className="accent-rose-500 w-4 h-4" />
                <label htmlFor="fragile" className="text-sm text-zinc-400 cursor-pointer">Fragile package</label>
              </div>
            </div>
          </div>

          {/* Vehicle type */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-zinc-300 mb-3">Vehicle type</h2>
            <div className="space-y-2">
              {VEHICLE_TYPES.map(v => (
                <button key={v.id} onClick={() => set('vehicleTypeId', v.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${form.vehicleTypeId === v.id ? 'border-rose-500 bg-rose-500/5' : 'border-zinc-800 hover:bg-zinc-800'}`}>
                  <span className="text-lg">{v.icon}</span>
                  <span className="text-sm text-zinc-300">{v.label}</span>
                  {form.vehicleTypeId === v.id && <ChevronRight size={14} className="ml-auto text-rose-400" />}
                </button>
              ))}
            </div>
          </div>

          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-700/50 rounded-lg">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <span className="text-sm text-red-300">{errors.submit}</span>
            </div>
          )}

          <button onClick={handleSubmit} disabled={submitting}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={14} className="animate-spin" />Creating shipment…</> : <><Package size={14} />Create shipment</>}
          </button>
        </div>

        {/* Right: Map + Fare preview */}
        <div className="space-y-4">
          {/* Map */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
              <MapPin size={13} className="text-zinc-500" />
              <span className="text-xs font-medium text-zinc-400">Route preview</span>
            </div>
            <div ref={mapContainerRef} className="h-56 w-full" />
            {!form.deliveryLatLng && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/60 pointer-events-none">
                <p className="text-xs text-zinc-500">Enter delivery address to see route</p>
              </div>
            )}
          </div>

          {/* Fare card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-zinc-300">Fare estimate</h2>
              {fareLoading && <Loader2 size={13} className="text-zinc-500 animate-spin" />}
            </div>

            {fareError && (
              <div className="text-xs text-red-400 flex items-center gap-1.5 mb-3">
                <AlertCircle size={12} /> {fareError}
              </div>
            )}

            {fareData ? (
              <>
                <div className="space-y-2 mb-4">
                  {[
                    { label: 'Distance',        value: `${fareData.distanceKm} km` },
                    { label: 'ETA',             value: `~${fareData.etaMinutes} min` },
                    { label: 'Base fare',       value: `रु ${fareData.fareBreakdown.baseFare}` },
                    { label: 'Distance charge', value: `रु ${fareData.fareBreakdown.distanceFare}` },
                    { label: 'Weight charge',   value: `रु ${fareData.fareBreakdown.weightFare}` },
                    ...(fareData.fareBreakdown.fragileCharge > 0  ? [{ label: 'Fragile',        value: `रु ${fareData.fareBreakdown.fragileCharge}` }]  : []),
                    ...(fareData.fareBreakdown.codCharge > 0      ? [{ label: 'COD charge',     value: `रु ${fareData.fareBreakdown.codCharge}` }]      : []),
                    ...(fareData.fareBreakdown.nightSurcharge > 0 ? [{ label: 'Night surcharge',value: `रु ${fareData.fareBreakdown.nightSurcharge}` }] : []),
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-xs">
                      <span className="text-zinc-500">{r.label}</span>
                      <span className="text-zinc-300">{r.value}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-800 pt-3 flex justify-between items-baseline">
                  <span className="text-sm text-zinc-400">Total fare</span>
                  <span className="text-xl font-semibold text-white">रु {fareData.totalFare.toLocaleString()}</span>
                </div>
                {fareData.fareBreakdown.minFareApplied && (
                  <p className="text-xs text-amber-400 mt-1.5">Minimum fare applied</p>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-zinc-600">Enter address and weight to see fare estimate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
