// src/modules/merchant/components/CreateShipment.jsx
import { useState, useRef,  useEffect } from "react";
import { useNavigate }                               from "react-router-dom";
import { Package, Loader2, ChevronRight, AlertCircle, MapPin, X, Printer } from "lucide-react";
import AddressAutocomplete                           from "./AddressAutocomplete";
import { useMapbox }                                 from "../../../shared/hooks/useMapbox";
import { apiPost }                                   from "../../../shared/hooks/useApi";
import { QRModal } from "../../../components/modals/QRModal";
import { useFarePreview } from "../hooks/useFarePreview";
import mapboxgl from 'mapbox-gl';
const VEHICLE_TYPES = [
  { id: 1, label: "Bike (up to 20 kg)",         icon: "🏍️" },
  { id: 2, label: "Mini Truck (up to 500 kg)",   icon: "🚐" },
  { id: 3, label: "Covered Van (up to 1500 kg)", icon: "🚚" },
];

const INITIAL = {
  receiverName: "", receiverPhone: "",
  deliveryAddress: "", deliveryLatLng: null,
  weightKg: "", isFragile: false,
  orderValue: "", codAmount: "",
  vehicleTypeId: 1,
};


// ── Main form ─────────────────────────────────────────────────────────────────

export default function CreateShipment() {
  const navigate = useNavigate();

  const [form, setForm]         = useState(INITIAL);
  const [submitting, setSub]    = useState(false);
  const [errors, setErrors]     = useState({});
  const [qrModal, setQrModal]   = useState(null); // { trackingNumber, qrCode }

  const { fareData, loading: fareLoading, error: fareError, setFareData } = useFarePreview(form);

  const mapContainerRef = useRef(null);
  const { mapRef, upsertMarker, drawRoute } = useMapbox(mapContainerRef, {
    center: [85.314, 27.717],
    zoom:   11,
    style:  "mapbox://styles/mapbox/dark-v11",
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));


// Handle Map updates when fareData changes
  useEffect(() => {
    if (fareData?.pickup && fareData?.delivery && mapRef.current) {
      const pickupLngLat = [fareData.pickup.lng, fareData.pickup.lat];
      const deliveryLngLat = [fareData.delivery.lng, fareData.delivery.lat];

      upsertMarker("pickup", pickupLngLat, {
        style: "width:12px;height:12px;border-radius:50%;background:#10b981;border:2px solid #fff",
        popup: '<div style="color:#111;font-size:12px;font-weight:500">Pickup</div>',
      });
      upsertMarker("delivery", deliveryLngLat, {
        style: "width:12px;height:12px;border-radius:50%;background:#f43f5e;border:2px solid #fff",
        popup: '<div style="color:#111;font-size:12px;font-weight:500">Delivery</div>',
      });
      drawRoute("preview", [pickupLngLat, deliveryLngLat]);

      const bounds = new mapboxgl.LngLatBounds()
        .extend(pickupLngLat)
        .extend(deliveryLngLat);
        
      mapRef.current.fitBounds(bounds, { padding: 60 });
    }
  }, [fareData, mapRef, upsertMarker, drawRoute]);
  // ── Validation ────────────────────────────────────────────────────────────

  const validate = () => {
    const e = {};
    if (!form.receiverName.trim())              e.receiverName    = "Required";
    if (!form.receiverPhone.trim())             e.receiverPhone   = "Required";
    if (!form.deliveryLatLng)                   e.deliveryAddress = "Select an address from the dropdown";
    if (!form.weightKg || form.weightKg <= 0)  e.weightKg        = "Enter package weight";
    if (!form.orderValue || form.orderValue <= 0) e.orderValue   = "Enter order value";
    return e;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSub(true);
    try {
      const result = await apiPost("/api/merchant/shipments", {
        ...form,
        fareSnapshot: fareData?.totalFare,
      });

      // Show QR modal immediately so merchant can print the label
      setQrModal({
        trackingNumber: result.trackingNumber,
        qrCode:         result.qrCode,
      });
      setForm(INITIAL);
      setFareData(null);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSub(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">New shipment</h1>
        <p className="text-sm text-gray-400 dark:text-zinc-500 mt-0.5">
          Addresses are autocompleted and geocoded automatically
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-5">
          {/* Receiver */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-4">Receiver details</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1.5 font-medium">
                  Full name <span className="text-rose-400">*</span>
                </label>
                <input
                  value={form.receiverName}
                  onChange={(e) => set("receiverName", e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-gray-100 dark:bg-zinc-800 border rounded-lg text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none transition-colors ${
                    errors.receiverName ? "border-red-500" : "border-gray-300 dark:border-zinc-700 focus:border-gray-500 dark:focus:border-zinc-500"
                  }`}
                  placeholder="Aarav Shah"
                />
                {errors.receiverName && <p className="text-xs text-red-400 mt-1">{errors.receiverName}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1.5 font-medium">
                  Phone <span className="text-rose-400">*</span>
                </label>
                <input
                  value={form.receiverPhone}
                  onChange={(e) => set("receiverPhone", e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-gray-100 dark:bg-zinc-800 border rounded-lg text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none transition-colors ${
                    errors.receiverPhone ? "border-red-500" : "border-gray-300 dark:border-zinc-700 focus:border-gray-500 dark:focus:border-zinc-500"
                  }`}
                  placeholder="98XXXXXXXX"
                />
                {errors.receiverPhone && <p className="text-xs text-red-400 mt-1">{errors.receiverPhone}</p>}
              </div>
              <AddressAutocomplete
                label="Delivery address"
                value={form.deliveryAddress}
                onChange={(addr, latLng) => { set("deliveryAddress", addr); set("deliveryLatLng", latLng); }}
                error={errors.deliveryAddress}
                required
              />
            </div>
          </div>

          {/* Package */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-4">Package details</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1.5 font-medium">
                  Weight (kg) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number" min="0.1" step="0.1"
                  value={form.weightKg}
                  onChange={(e) => set("weightKg", e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-gray-100 dark:bg-zinc-800 border rounded-lg text-gray-800 dark:text-zinc-200 focus:outline-none transition-colors ${
                    errors.weightKg ? "border-red-500" : "border-gray-300 dark:border-zinc-700 focus:border-gray-500 dark:focus:border-zinc-500"
                  }`}
                  placeholder="1.5"
                />
                {errors.weightKg && <p className="text-xs text-red-400 mt-1">{errors.weightKg}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1.5 font-medium">
                  Order value (रु) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number" min="0"
                  value={form.orderValue}
                  onChange={(e) => set("orderValue", e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-gray-100 dark:bg-zinc-800 border rounded-lg text-gray-800 dark:text-zinc-200 focus:outline-none transition-colors ${
                    errors.orderValue ? "border-red-500" : "border-gray-300 dark:border-zinc-700 focus:border-gray-500 dark:focus:border-zinc-500"
                  }`}
                  placeholder="2400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1.5 font-medium">COD amount (रु)</label>
                <input
                  type="number" min="0"
                  value={form.codAmount}
                  onChange={(e) => set("codAmount", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-800 dark:text-zinc-200 focus:outline-none transition-colors"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox" id="fragile"
                  checked={form.isFragile}
                  onChange={(e) => set("isFragile", e.target.checked)}
                  className="accent-rose-500 w-4 h-4"
                />
                <label htmlFor="fragile" className="text-sm text-gray-500 dark:text-zinc-400 cursor-pointer">
                  Fragile package
                </label>
              </div>
            </div>
          </div>

          {/* Vehicle type */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
            <h2 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">Vehicle type</h2>
            <div className="space-y-2">
              {VEHICLE_TYPES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => set("vehicleTypeId", v.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    form.vehicleTypeId === v.id
                      ? "border-rose-500 bg-rose-500/5"
                      : "border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-lg">{v.icon}</span>
                  <span className="text-sm text-gray-700 dark:text-zinc-300">{v.label}</span>
                  {form.vehicleTypeId === v.id && (
                    <ChevronRight size={14} className="ml-auto text-rose-400" />
                  )}
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

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {submitting
              ? <><Loader2 size={14} className="animate-spin" /> Creating shipment…</>
              : <><Package size={14} /> Create shipment</>}
          </button>
        </div>

        {/* Right: Map + Fare preview */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-2">
              <MapPin size={13} className="text-gray-400 dark:text-zinc-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Route preview</span>
            </div>
            <div ref={mapContainerRef} className="h-56 w-full" />
            {!form.deliveryLatLng && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-zinc-900/60 pointer-events-none">
                <p className="text-xs text-gray-400 dark:text-zinc-500">Enter delivery address to see route</p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-700 dark:text-zinc-300">Fare estimate</h2>
              {fareLoading && <Loader2 size={13} className="text-gray-400 dark:text-zinc-500 animate-spin" />}
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
                    { label: "Distance",         value: `${fareData.distanceKm} km` },
                    { label: "ETA",              value: `~${fareData.etaMinutes} min` },
                    { label: "Base fare",        value: `रु ${fareData.fareBreakdown.baseFare}` },
                    { label: "Distance charge",  value: `रु ${fareData.fareBreakdown.distanceFare}` },
                    { label: "Weight charge",    value: `रु ${fareData.fareBreakdown.weightFare}` },
                    ...(fareData.fareBreakdown.fragileCharge  > 0 ? [{ label: "Fragile",         value: `रु ${fareData.fareBreakdown.fragileCharge}` }]  : []),
                    ...(fareData.fareBreakdown.codCharge      > 0 ? [{ label: "COD charge",      value: `रु ${fareData.fareBreakdown.codCharge}` }]      : []),
                    ...(fareData.fareBreakdown.nightSurcharge > 0 ? [{ label: "Night surcharge", value: `रु ${fareData.fareBreakdown.nightSurcharge}` }] : []),
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between text-xs">
                      <span className="text-gray-400 dark:text-zinc-500">{r.label}</span>
                      <span className="text-gray-700 dark:text-zinc-300">{r.value}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 dark:border-zinc-800 pt-3 flex justify-between items-baseline">
                  <span className="text-sm text-gray-500 dark:text-zinc-400">Total fare</span>
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">
                    रु {fareData.totalFare.toLocaleString()}
                  </span>
                </div>
                {fareData.fareBreakdown.minFareApplied && (
                  <p className="text-xs text-amber-400 mt-1.5">Minimum fare applied</p>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-gray-300 dark:text-zinc-600">
                  Enter address and weight to see fare estimate
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR modal — shown immediately after shipment is created */}
      {qrModal && (
        <QRModal
          trackingNumber={qrModal.trackingNumber}
          qrCode={qrModal.qrCode}
          onClose={() => setQrModal(null)}
          onDone={() => navigate("/merchant/shipments")}
        />
      )}
    </div>
  );
}