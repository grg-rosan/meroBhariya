// src/modules/merchant/components/CreateShipment.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Loader2, ChevronRight, AlertCircle, MapPin } from "lucide-react";
import AddressAutocomplete from "./AddressAutocomplete";
import { useMapLibre } from "../../../shared/hooks/useMapLibre.js";
import { apiPost } from "../../../shared/hooks/useApi.js";
import { QRModal } from "../../../components/modals/QRModal.jsx";
import maplibregl from "maplibre-gl";

// TODO Phase 4 — uncomment when wallet + fare preview is built
// import { useFarePreview } from "../hooks/useFarePreview";

const VEHICLE_TYPES = [
  { id: 1, label: "Bike (up to 20 kg)",         icon: "🏍️" },
  { id: 2, label: "Mini Truck (up to 500 kg)",   icon: "🚐" },
  { id: 3, label: "Covered Van (up to 1500 kg)", icon: "🚚" },
];

const INITIAL = {
  receiverName:    "",
  receiverPhone:   "",
  deliveryAddress: "",
  deliveryLatLng:  null,
  weight:          "",   // ← matches backend field name
  isFragile:       false,
  orderValue:      "",
  codAmount:       "",
  vehicleTypeId:   1,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls = (hasError) =>
  `w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none transition-colors
   bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100
   placeholder-gray-400 dark:placeholder-zinc-500
   ${hasError
     ? "border-red-400 dark:border-red-500 focus:border-red-500 dark:focus:border-red-400"
     : "border-gray-300 dark:border-zinc-600 focus:border-gray-500 dark:focus:border-zinc-400"
   }`;

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-5 shadow-md ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-200 mb-4">{children}</h2>
);

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">
    {children} {required && <span className="text-rose-400">*</span>}
  </label>
);

// ── Main component ────────────────────────────────────────────────────────────

export default function CreateShipment() {
  const navigate = useNavigate();

  const [form, setForm]       = useState(INITIAL);
  const [submitting, setSub]  = useState(false);
  const [errors, setErrors]   = useState({});
  const [qrModal, setQrModal] = useState(null);

  // TODO Phase 4 — replace these stubs with useFarePreview(form)
  // const { fareData, loading: fareLoading, error: fareError, setFareData } = useFarePreview(form);
  const fareData    = null;
  const fareLoading = false;
  const fareError   = null;

  const mapContainerRef = useRef(null);
  const { mapRef, upsertMarker, drawRoute } = useMapLibre(mapContainerRef, {
    center: [85.314, 27.717],
    zoom:   11,
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // ── Map — show delivery pin when address is selected ──────────────────────
  useEffect(() => {
    if (!form.deliveryLatLng || !mapRef.current) return;

    const lngLat = [form.deliveryLatLng.lng, form.deliveryLatLng.lat];

    upsertMarker("delivery", lngLat, {
      style: "width:12px;height:12px;border-radius:50%;background:#f43f5e;border:2px solid #fff",
      popup: '<div style="color:#111;font-size:12px;font-weight:500">Delivery</div>',
    });

    mapRef.current.flyTo({ center: lngLat, zoom: 14, duration: 800 });

    // TODO Phase 4 — when fareData includes pickup coords, draw full route:
    // if (fareData?.pickup) {
    //   const pickupLngLat = [fareData.pickup.lng, fareData.pickup.lat];
    //   upsertMarker("pickup", pickupLngLat, { ... });
    //   drawRoute("preview", [pickupLngLat, lngLat]);
    //   mapRef.current.fitBounds(
    //     new maplibregl.LngLatBounds().extend(pickupLngLat).extend(lngLat),
    //     { padding: 60 }
    //   );
    // }
  }, [form.deliveryLatLng, mapRef, upsertMarker]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.receiverName.trim())              e.receiverName    = "Required";
    if (!form.receiverPhone.trim())             e.receiverPhone   = "Required";
    if (!form.deliveryLatLng)                   e.deliveryAddress = "Select an address from the dropdown";
    if (!form.weight || form.weight <= 0)       e.weight          = "Enter package weight";
    if (!form.orderValue || form.orderValue <= 0) e.orderValue    = "Enter order value";
    return e;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSub(true);
    try {
      const result = await apiPost("/api/merchant/shipments", {
        receiverName:    form.receiverName,
        receiverPhone:   form.receiverPhone,
        deliveryAddress: form.deliveryAddress,
        vehicleTypeId:   form.vehicleTypeId,
        weight:          Number(form.weight),
        isFragile:       form.isFragile,
        orderValue:      Number(form.orderValue),
        codAmount:       Number(form.codAmount || 0),
        paymentType:     "PREPAID", // TODO Phase 4 — derive from wallet/COD selection
        // fareSnapshot: fareData?.totalFare, // TODO Phase 4 — uncomment
      });

      setQrModal({
        trackingNumber: result.trackingNumber,
        qrCode:         result.qrCode,
      });
      setForm(INITIAL);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSub(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">New shipment</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-500 mt-0.5">
          Addresses are autocompleted and geocoded automatically
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* ── Left column ────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Receiver details */}
          <Card>
            <SectionTitle>Receiver details</SectionTitle>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Full name</FieldLabel>
                <input
                  value={form.receiverName}
                  onChange={(e) => set("receiverName", e.target.value)}
                  className={inputCls(errors.receiverName)}
                  placeholder="Aarav Shah"
                />
                {errors.receiverName && <p className="text-xs text-red-400 mt-1">{errors.receiverName}</p>}
              </div>

              <div>
                <FieldLabel required>Phone</FieldLabel>
                <input
                  value={form.receiverPhone}
                  onChange={(e) => set("receiverPhone", e.target.value)}
                  className={inputCls(errors.receiverPhone)}
                  placeholder="98XXXXXXXX"
                />
                {errors.receiverPhone && <p className="text-xs text-red-400 mt-1">{errors.receiverPhone}</p>}
              </div>

              <AddressAutocomplete
                label="Delivery address"
                value={form.deliveryAddress}
                onChange={(addr, latLng) => {
                  set("deliveryAddress", addr);
                  set("deliveryLatLng", latLng);
                }}
                error={errors.deliveryAddress}
                required
              />
            </div>
          </Card>

          {/* Package details */}
          <Card>
            <SectionTitle>Package details</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Weight (kg)</FieldLabel>
                <input
                  type="number" min="0.1" step="0.1"
                  value={form.weight}
                  onChange={(e) => set("weight", e.target.value)}
                  className={inputCls(errors.weight)}
                  placeholder="1.5"
                />
                {errors.weight && <p className="text-xs text-red-400 mt-1">{errors.weight}</p>}
              </div>

              <div>
                <FieldLabel required>Order value (रु)</FieldLabel>
                <input
                  type="number" min="0"
                  value={form.orderValue}
                  onChange={(e) => set("orderValue", e.target.value)}
                  className={inputCls(errors.orderValue)}
                  placeholder="2400"
                />
                {errors.orderValue && <p className="text-xs text-red-400 mt-1">{errors.orderValue}</p>}
              </div>

              <div>
                <FieldLabel>COD amount (रु)</FieldLabel>
                <input
                  type="number" min="0"
                  value={form.codAmount}
                  onChange={(e) => set("codAmount", e.target.value)}
                  className={inputCls(false)}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox" id="fragile"
                  checked={form.isFragile}
                  onChange={(e) => set("isFragile", e.target.checked)}
                  className="accent-rose-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="fragile" className="text-sm text-gray-600 dark:text-zinc-400 cursor-pointer select-none">
                  Fragile package
                </label>
              </div>
            </div>
          </Card>

          {/* Vehicle type */}
          <Card>
            <SectionTitle>Vehicle type</SectionTitle>
            <div className="space-y-2">
              {VEHICLE_TYPES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => set("vehicleTypeId", v.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    form.vehicleTypeId === v.id
                      ? "border-rose-500 bg-rose-500/8 dark:bg-rose-500/10"
                      : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-lg">{v.icon}</span>
                  <span className="text-sm text-gray-700 dark:text-zinc-300 font-medium">{v.label}</span>
                  {form.vehicleTypeId === v.id && (
                    <ChevronRight size={14} className="ml-auto text-rose-400" />
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* Submit error */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-700/50 rounded-lg">
              <AlertCircle size={14} className="text-red-500 dark:text-red-400 shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-300">{errors.submit}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-sm font-medium rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {submitting
              ? <><Loader2 size={14} className="animate-spin" /> Creating shipment…</>
              : <><Package size={14} /> Create shipment</>
            }
          </button>
        </div>

        {/* ── Right column ───────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Map */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-md">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700 flex items-center gap-2">
              <MapPin size={13} className="text-gray-400 dark:text-zinc-500" />
              <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wide">
                Route preview
              </span>
            </div>
            <div className="relative">
              <div ref={mapContainerRef} className="h-56 w-full" />
              {!form.deliveryLatLng && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-zinc-900/70 pointer-events-none">
                  <p className="text-xs text-gray-500 dark:text-zinc-500">
                    Enter delivery address to see route
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Fare estimate — TODO Phase 4 ──────────────────────────────
            Uncomment this entire block when wallet + fare preview is built.
            Also uncomment useFarePreview import and hook call above.

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-200">Fare estimate</h2>
              {fareLoading && <Loader2 size={13} className="text-gray-400 animate-spin" />}
            </div>

            {fareError && (
              <div className="text-xs text-red-500 flex items-center gap-1.5 mb-3">
                <AlertCircle size={12} /> {fareError}
              </div>
            )}

            {fareData ? (
              <>
                <div className="space-y-2 mb-4">
                  {[
                    { label: "Distance",        value: `${fareData.distanceKm} km` },
                    { label: "ETA",             value: `~${fareData.etaMinutes} min` },
                    { label: "Base fare",       value: `रु ${fareData.fareBreakdown.baseFare}` },
                    { label: "Distance charge", value: `रु ${fareData.fareBreakdown.distanceFare}` },
                    { label: "Weight charge",   value: `रु ${fareData.fareBreakdown.weightFare}` },
                    ...(fareData.fareBreakdown.fragileCharge  > 0 ? [{ label: "Fragile",         value: `रु ${fareData.fareBreakdown.fragileCharge}` }]  : []),
                    ...(fareData.fareBreakdown.codCharge      > 0 ? [{ label: "COD charge",      value: `रु ${fareData.fareBreakdown.codCharge}` }]      : []),
                    ...(fareData.fareBreakdown.nightSurcharge > 0 ? [{ label: "Night surcharge", value: `रु ${fareData.fareBreakdown.nightSurcharge}` }] : []),
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-zinc-500">{r.label}</span>
                      <span className="text-gray-800 dark:text-zinc-300 font-medium">{r.value}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 dark:border-zinc-700 pt-3 flex justify-between items-baseline">
                  <span className="text-sm text-gray-600 dark:text-zinc-400">Total fare</span>
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">
                    रु {fareData.totalFare.toLocaleString()}
                  </span>
                </div>
                {fareData.fareBreakdown.minFareApplied && (
                  <p className="text-xs text-amber-500 mt-1.5">Minimum fare applied</p>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400 dark:text-zinc-600">
                  Enter address and weight to see fare estimate
                </p>
              </div>
            )}
          </Card>
          ── End fare estimate ── */}

        </div>
      </div>

      {/* QR modal — lives in components/modals/QRModal.jsx */}
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