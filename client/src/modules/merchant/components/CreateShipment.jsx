// src/modules/merchant/components/CreateShipment.jsx
import { useState, useRef, useEffect } from "react";
import { Loader2, AlertCircle, MapPin, CreditCard } from "lucide-react";

import { useMapLibre } from "../../../shared/hooks/useMapLibre.js";
import { apiGet, apiPost } from "../../../shared/hooks/useApi.js";
import { useFarePreview } from "../hooks/useFarePreview.js";
import { useMerchantProfile } from "../hooks/useMerchantProfile.js";
import { useToast } from "../../../context/ToastContext";

import ReceiverSection from "./shipment/RecieverSection.jsx";
import PackageSection from "./shipment/PackageSection.jsx";
import PaymentSection from "./shipment/PaymentSection.jsx";
import VehicleSection from "./shipment/VehicleSection.jsx";
import MapPreview from "./shipment/MapPreview.jsx";
import FarePreviewCard from "./shipment/FarePreviewCard.jsx";

// ─── shared primitives ────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-4">
    {children}
  </h2>
);

// ─── form defaults ────────────────────────────────────────────
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

// ─── validation ───────────────────────────────────────────────
function validate(form, fromDistrictId) {
  const e = {};
  if (!form.receiverName.trim()) e.receiverName = "Required";
  if (!form.receiverPhone.trim()) e.receiverPhone = "Required";
  if (!form.deliveryLat || !form.deliveryLng)
    e.deliveryAddress = "Select an address from the dropdown";
  if (!form.weight || Number(form.weight) <= 0)
    e.weight = "Enter package weight";
  if (!form.orderValue || Number(form.orderValue) <= 0)
    e.orderValue = "Enter order value";
  if (!fromDistrictId)
    e.submit =
      "Merchant pickup district could not be resolved. Contact support.";
  if (!form.toDistrictId)
    e.deliveryAddress =
      "We currently only deliver within Kathmandu and Makwanpur.";
  if (form.paymentType === "COD") {
    if (!form.codAmount || Number(form.codAmount) <= 0)
      e.codAmount = "Required for COD";
    else if (Number(form.codAmount) > Number(form.orderValue))
      e.codAmount = "Cannot exceed order value";
  }
  return e;
}

// ─── main ─────────────────────────────────────────────────────
export default function CreateShipment() {
  const toast = useToast();
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSub] = useState(false);
  const [errors, setErrors] = useState({});
  const [districts, setDistricts] = useState([]);

  const { fromDistrictId, pickupAddress } = useMerchantProfile(districts);
  const {
    fareData,
    loading: fareLoading,
    error: fareError,
  } = useFarePreview(form, fromDistrictId);

  const mapContainerRef = useRef(null);
  const { mapRef, upsertMarker } = useMapLibre(mapContainerRef, {
    center: [85.314, 27.717],
    zoom: 11,
  });

  // ── field updater ──────────────────────────────────────────
  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key])
      setErrors((e) => {
        const n = { ...e };
        delete n[key];
        return n;
      });
  };

  // ── districts ──────────────────────────────────────────────
  useEffect(() => {
    apiGet("/api/merchant/shipments/districts")
      .then((res) => setDistricts(res.data ?? []))
      .catch(() => {});
  }, []);

  // ── map pin ────────────────────────────────────────────────
  useEffect(() => {
    if (!form.deliveryLat || !form.deliveryLng || !mapRef.current) return;
    const lngLat = [form.deliveryLng, form.deliveryLat];
    upsertMarker("delivery", lngLat, {
      style:
        "width:12px;height:12px;border-radius:50%;background:#f43f5e;border:2px solid #fff",
      popup:
        '<div style="color:#111;font-size:12px;font-weight:500">Delivery</div>',
    });
    mapRef.current.flyTo({ center: lngLat, zoom: 14, duration: 800 });
  }, [form.deliveryLat, form.deliveryLng, mapRef, upsertMarker]);

  // ── address change (special: updates multiple fields) ──────
  const handleAddressChange = (addr, latLng, districtId) => {
    setForm((f) => ({
      ...f,
      deliveryAddress: addr,
      deliveryLat: latLng?.lat ?? null,
      deliveryLng: latLng?.lng ?? null,
      toDistrictId: districtId ?? f.toDistrictId,
    }));
    if (errors.deliveryAddress)
      setErrors((e) => {
        const n = { ...e };
        delete n.deliveryAddress;
        return n;
      });
  };

  const handleSubmit = async () => {
    const e = validate(form, fromDistrictId);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

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
      toast({ message: "Redirecting to payment…", type: "info" });
      window.location.href = result.data.paymentUrl;
    } catch (err) {
      const msg = err.message ?? "Failed to create shipment.";
      setErrors({ submit: msg });
      toast({ message: msg, type: "error" });
      setSub(false);
    }
  };

  const toDistrictName = form.toDistrictId
    ? districts.find((d) => d.id === form.toDistrictId)?.name
    : null;

  // ── render ─────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          New shipment
        </h1>
        {pickupAddress && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
            <MapPin size={11} /> Pickup: {pickupAddress}
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Left column ──────────────────────────────────── */}
        <div className="space-y-5">
          <Card>
            <SectionTitle>Receiver details</SectionTitle>
            <ReceiverSection
              receiverName={form.receiverName}
              receiverPhone={form.receiverPhone}
              deliveryAddress={form.deliveryAddress}
              districts={districts}
              errors={errors}
              toDistrictName={toDistrictName}
              onChange={set}
              onAddressChange={handleAddressChange}
            />
          </Card>

          <Card>
            <SectionTitle>Package details</SectionTitle>
            <PackageSection
              weight={form.weight}
              orderValue={form.orderValue}
              isFragile={form.isFragile}
              errors={errors}
              onChange={set}
            />
          </Card>

          <Card>
            <SectionTitle>Payment type</SectionTitle>
            <PaymentSection
              paymentType={form.paymentType}
              codAmount={form.codAmount}
              errors={errors}
              onChange={set}
            />
          </Card>

          <Card>
            <SectionTitle>Vehicle type</SectionTitle>
            <VehicleSection vehicleTypeId={form.vehicleTypeId} onChange={set} />
          </Card>

          {/* Submit error */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-700/50 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <span className="text-sm text-red-600 dark:text-red-300">
                {errors.submit}
              </span>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-sm font-medium rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Redirecting to
                Khalti…
              </>
            ) : (
              <>
                <CreditCard size={14} /> Pay & Ship — रु{" "}
                {fareData ? Number(fareData.totalFare).toLocaleString() : "…"}
              </>
            )}
          </button>
        </div>

        {/* ── Right column ─────────────────────────────────── */}
        <div className="space-y-4">
          <MapPreview
            mapContainerRef={mapContainerRef}
            hasDeliveryLocation={!!form.deliveryLat}
          />
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
