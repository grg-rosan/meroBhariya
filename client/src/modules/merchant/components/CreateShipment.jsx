// src/modules/merchant/components/CreateShipment.jsx
import { useState, useRef, useEffect } from "react";
import {
  Package, Loader2, ChevronRight,
  AlertCircle, MapPin, CreditCard, Banknote,
} from "lucide-react";
import AddressAutocomplete from "./AddressAutocomplete";
import { useMapLibre } from "../../../shared/hooks/useMapLibre.js";
import { apiGet, apiPost } from "../../../shared/hooks/useApi.js";
import { useFarePreview } from "../hooks/useFarePreview.js";
import { useMerchantProfile } from "../hooks/useMerchantProfile.js";

const VEHICLE_TYPES = [
  { id: 1, label: "Bike", sub: "up to 20 kg", icon: "🏍️" },
  { id: 2, label: "Mini Truck", sub: "up to 500 kg", icon: "🚐" },
  { id: 3, label: "Covered Van", sub: "up to 1500 kg", icon: "🚚" },
];

const INITIAL = {
  receiverName: "",
  receiverPhone: "",
  deliveryAddress: "",
  deliveryLat: null,
  deliveryLng: null,
  weight: "",
  isFragile: false,
  orderValue: "",
  codAmount: "",
  paymentType: "PREPAID",
  vehicleTypeId: 1,
  toDistrictId: null,
};

const inputCls = (hasError) =>
  `w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none transition-colors
   bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100
   placeholder-gray-400 dark:placeholder-zinc-500
   ${hasError
    ? "border-red-400 dark:border-red-500"
    : "border-gray-300 dark:border-zinc-600 focus:border-gray-500 dark:focus:border-zinc-400"
  }`;

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl p-5 shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-200 mb-4">{children}</h2>
);

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">
    {children}{required && <span className="text-rose-400 ml-0.5">*</span>}
  </label>
);

const FieldError = ({ msg }) =>
  msg ? <p className="text-xs text-red-400 mt-1">{msg}</p> : null;

// ─────────────────────────────────────────────────────────────
// FARE PREVIEW CARD
// ─────────────────────────────────────────────────────────────

function FarePreviewCard({ fareData, loading, error }) {
  if (!fareData && !loading && !error) return null;

  const rows = fareData ? [
    { label: "Distance", value: `${fareData.distanceKm} km` },
    { label: "Zone", value: fareData.zone },
    { label: "Base fare", value: `रु ${fareData.baseFare}` },
    { label: "Distance charge", value: `रु ${fareData.distanceFare}` },
    { label: "Weight charge", value: `रु ${fareData.weightFare}` },
    ...(fareData.fragileCharge > 0 ? [{ label: "Fragile", value: `रु ${fareData.fragileCharge}` }] : []),
    ...(fareData.zoneSurcharge > 0 ? [{ label: "Zone surcharge", value: `रु ${fareData.zoneSurcharge}` }] : []),
    ...(fareData.codFee > 0 ? [{ label: "COD fee", value: `रु ${fareData.codFee}` }] : []),
  ] : [];

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

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

export default function CreateShipment() {

  const [form, setForm] = useState(INITIAL);
  const [submitting, setSub] = useState(false);
  const [errors, setErrors] = useState({});
  const [districts, setDistricts] = useState([]);

  // Pass districts so profile hook can resolve fromDistrictId from pickupAddress
  const { fromDistrictId, pickupAddress } = useMerchantProfile(districts);

  const { fareData, loading: fareLoading, error: fareError } = useFarePreview(form, fromDistrictId);

  const mapContainerRef = useRef(null);
  const { mapRef, upsertMarker } = useMapLibre(mapContainerRef, {
    center: [85.314, 27.717],
    zoom: 11,
  });

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  // Load districts — used for address→toDistrict and pickup→fromDistrict resolution
  useEffect(() => {
    apiGet("/api/merchant/shipments/districts")
      .then((res) => setDistricts(res.data ?? []))
      .catch(() => { });
  }, []);

  // Map pin
  useEffect(() => {
    if (!form.deliveryLat || !form.deliveryLng || !mapRef.current) return;
    const lngLat = [form.deliveryLng, form.deliveryLat];
    upsertMarker("delivery", lngLat, {
      style: "width:12px;height:12px;border-radius:50%;background:#f43f5e;border:2px solid #fff",
      popup: '<div style="color:#111;font-size:12px;font-weight:500">Delivery</div>',
    });
    mapRef.current.flyTo({ center: lngLat, zoom: 14, duration: 800 });
  }, [form.deliveryLat, form.deliveryLng, mapRef, upsertMarker]);

  const validate = () => {
    const e = {};
    if (!form.receiverName.trim()) e.receiverName = "Required";
    if (!form.receiverPhone.trim()) e.receiverPhone = "Required";
    if (!form.deliveryLat || !form.deliveryLng) e.deliveryAddress = "Select an address from the dropdown";
    if (!form.weight || Number(form.weight) <= 0) e.weight = "Enter package weight";
    if (!form.orderValue || Number(form.orderValue) <= 0) e.orderValue = "Enter order value";
    if (!fromDistrictId) e.submit = "Merchant pickup district could not be resolved. Contact support.";
    if (!form.toDistrictId)
      e.deliveryAddress = "We currently only deliver within Kathmandu and Makwanpur.";
    if (form.paymentType === "COD") {
      if (!form.codAmount || Number(form.codAmount) <= 0)
        e.codAmount = "Required for COD";
      else if (Number(form.codAmount) > Number(form.orderValue))
        e.codAmount = "Cannot exceed order value";
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSub(true);
    try {
      const result = await apiPost("/api/merchant/payment/initiate", {
        vehicleTypeId: form.vehicleTypeId,
        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone,
        deliveryAddress: form.deliveryAddress,
        weight: Number(form.weight),
        isFragile: form.isFragile,
        orderValue: Number(form.orderValue),
        codAmount: form.paymentType === "COD" ? Number(form.codAmount) : 0,
        paymentType: form.paymentType,
        deliveryLat: form.deliveryLat,
        deliveryLng: form.deliveryLng,
        fromDistrictId: Number(fromDistrictId),
        toDistrictId: Number(form.toDistrictId),
      });

      // Redirect to Khalti — user comes back to /merchant/payment/verify
      window.location.href = result.data.paymentUrl;
    } catch (err) {
      setErrors({ submit: err.message });
      setSub(false); // only reset on error; success redirects away
    }
  };
  const toDistrictName = form.toDistrictId
    ? districts.find((d) => d.id === form.toDistrictId)?.name
    : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">New shipment</h1>
        {pickupAddress && (
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
            <MapPin size={11} /> Pickup: {pickupAddress}
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* ── Left ─────────────────────────────────────────── */}
        <div className="space-y-5">

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
                <FieldError msg={errors.receiverName} />
              </div>
              <div>
                <FieldLabel required>Phone</FieldLabel>
                <input
                  value={form.receiverPhone}
                  onChange={(e) => set("receiverPhone", e.target.value)}
                  className={inputCls(errors.receiverPhone)}
                  placeholder="98XXXXXXXX"
                />
                <FieldError msg={errors.receiverPhone} />
              </div>

              <AddressAutocomplete
                label="Delivery address"
                value={form.deliveryAddress}
                districts={districts}
                onChange={(addr, latLng, districtId) => {
                  setForm((f) => ({
                    ...f,
                    deliveryAddress: addr,
                    deliveryLat: latLng?.lat ?? null,
                    deliveryLng: latLng?.lng ?? null,
                    toDistrictId: districtId ?? f.toDistrictId,
                  }));
                  if (errors.deliveryAddress)
                    setErrors((e) => { const n = { ...e }; delete n.deliveryAddress; return n; });
                }}
                error={errors.deliveryAddress}
                required
              />

              {toDistrictName && (
                <p className="text-xs text-gray-400 dark:text-zinc-600 flex items-center gap-1 -mt-1">
                  <MapPin size={10} /> Delivery district: {toDistrictName}
                </p>
              )}
            </div>
          </Card>

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
                <FieldError msg={errors.weight} />
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
                <FieldError msg={errors.orderValue} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
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
          </Card>

          <Card>
            <SectionTitle>Payment type</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[
                { value: "PREPAID", label: "Prepaid", icon: CreditCard },
                { value: "COD", label: "COD", icon: Banknote },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => set("paymentType", value)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.paymentType === value
                    ? "border-rose-500 bg-rose-500/8 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600"
                    }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
            {form.paymentType === "COD" && (
              <div>
                <FieldLabel required>COD amount (रु)</FieldLabel>
                <input
                  type="number" min="0"
                  value={form.codAmount}
                  onChange={(e) => set("codAmount", e.target.value)}
                  className={inputCls(errors.codAmount)}
                  placeholder="Amount to collect from receiver"
                />
                <FieldError msg={errors.codAmount} />
                {!errors.codAmount && (
                  <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">Must be ≤ order value</p>
                )}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>Vehicle type</SectionTitle>
            <div className="space-y-2">
              {VEHICLE_TYPES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => set("vehicleTypeId", v.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${form.vehicleTypeId === v.id
                    ? "border-rose-500 bg-rose-500/8 dark:bg-rose-500/10"
                    : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    }`}
                >
                  <span className="text-lg">{v.icon}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{v.label}</span>
                    <span className="text-xs text-gray-400 dark:text-zinc-500 ml-2">{v.sub}</span>
                  </div>
                  {form.vehicleTypeId === v.id && <ChevronRight size={14} className="text-rose-400" />}
                </button>
              ))}
            </div>
          </Card>

          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-700/50 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-300">{errors.submit}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-sm font-medium rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {submitting
              ? <><Loader2 size={14} className="animate-spin" /> Redirecting to Khalti…</>
              : <><CreditCard size={14} /> Pay & Ship — रु {fareData ? Number(fareData.totalFare).toLocaleString() : "…"}</>
            }
          </button>
        </div>

        {/* ── Right ────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700 flex items-center gap-2">
              <MapPin size={13} className="text-gray-400 dark:text-zinc-500" />
              <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wide">
                Route preview
              </span>
            </div>
            <div className="relative">
              <div ref={mapContainerRef} className="h-56 w-full" />
              {!form.deliveryLat && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-zinc-900/70 pointer-events-none">
                  <p className="text-xs text-gray-500 dark:text-zinc-500">
                    Enter delivery address to see route
                  </p>
                </div>
              )}
            </div>
          </div>

          <FarePreviewCard
            fareData={fareData}
            loading={fareLoading}
            error={fareError}
          />
        </div>
      </div>
    </div>
  );
}