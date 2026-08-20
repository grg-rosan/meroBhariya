// src/modules/merchant/components/CreateShipment.jsx
import { useState, useRef, useEffect } from "react";
import { Loader2, AlertCircle, MapPin, CreditCard, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useMapLibre } from "../../../shared/hooks/useMapLibre.js";
import { apiGet, apiPost } from "../../../shared/hooks/useApi.js";
import { useFarePreview } from "../hooks/useFarePreview.js";
import { useMerchantProfile } from "../hooks/useMerchantProfile.js";
import { useToast } from "../../../context/ToastContext";
import AddressAutocomplete from "./AddressAutocomplete.jsx";

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

function ProfileCompletionForm({ districts, onSave }) {
  const [address, setAddress] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!address.trim()) {
      setError("Pickup address is required");
      return;
    }
    if (!latitude || !longitude) {
      setError("Please select a pickup address from the suggestions");
      return;
    }
    if (!districtId) {
      setError("Pickup district is required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSave({ address, districtId: Number(districtId), latitude, longitude });
    } catch (err) {
      console.error(err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 text-left">
      <AddressAutocomplete
        label="Pickup address"
        value={address}
        districts={districts}
        onChange={(addr, latLng, resolvedDistrictId) => {
          setAddress(addr);
          setLatitude(latLng?.lat ?? null);
          setLongitude(latLng?.lng ?? null);
          if (resolvedDistrictId) {
            setDistrictId(resolvedDistrictId);
          }
          setError("");
        }}
        required
      />

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
          Pickup District
        </label>
        <select
          value={districtId}
          onChange={(e) => {
            setDistrictId(e.target.value);
            setError("");
          }}
          required
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <option value="">Select a district...</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.province})
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}

      <button
        type="submit"
        disabled={!address || !districtId || loading}
        className="w-full py-2 px-4 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Saving...
          </>
        ) : (
          "Save & Continue"
        )}
      </button>
    </form>
  );
}

// ─── main ─────────────────────────────────────────────────────
export default function CreateShipment() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSub] = useState(false);
  const [errors, setErrors] = useState({});
  const [districts, setDistricts] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const {
    profile,
    fromDistrictId,
    pickupAddress,
    isVerified,
    loading: profileLoading,
    updateProfile,
  } = useMerchantProfile(districts);

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

  // ── address change ─────────────────────────────────────────
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

  // ── cancel helpers ─────────────────────────────────────────
  const isDirty = Object.keys(INITIAL).some((k) => {
    const v = form[k];
    return v !== INITIAL[k] && v !== "" && v !== null && v !== false;
  });

  const handleCancel = () => {
    if (!isDirty) return navigate(-1);
    setShowCancelModal(true);
  };

  const confirmCancel = () => navigate(-1);

  // ── submit ─────────────────────────────────────────────────
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

  // ── loading state (profile still resolving) ─────────────────
  if (profileLoading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto flex justify-center py-20">
        <Loader2 size={20} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  // ── unverified merchant gate ─────────────────────────────────
  if (!isVerified) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center gap-3 py-16 px-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl">
          <AlertCircle size={28} className="text-amber-500" />
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
            Verification pending
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
            Your merchant account is still under review. You'll be able to
            create shipments once it's verified.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-2 px-4 py-2 rounded-lg text-sm font-medium border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // ── incomplete profile gate (missing pickup district or coordinates) ────────
  if (!fromDistrictId || !profile?.latitude || !profile?.longitude) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <div className="flex flex-col items-center text-center gap-3 py-12 px-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-sm">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full mb-2">
            <MapPin size={28} />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
            Complete your profile
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">
            Before you can create shipments, please set your pickup location. This is required for distance-based fare calculations.
          </p>
          <ProfileCompletionForm
            districts={districts}
            onSave={async ({ address, districtId, latitude, longitude }) => {
              await updateProfile({
                pickupAddress: address,
                pickupDistrictId: districtId,
                latitude,
                longitude,
              });
            }}
          />
        </div>
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────
  return (
    <>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              New shipment
            </h1>
            {pickupAddress && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
                <MapPin size={11} /> Pickup: {pickupAddress}
              </p>
            )}
          </div>

          <button
            onClick={handleCancel}
            disabled={submitting}
            className="
              flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
              text-zinc-500 dark:text-zinc-400
              hover:text-zinc-800 dark:hover:text-zinc-100
              hover:bg-zinc-100 dark:hover:bg-zinc-800
              active:bg-zinc-200 dark:active:bg-zinc-700
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors
            "
            aria-label="Cancel shipment creation"
          >
            <X size={15} />
            <span className="hidden md:inline">Cancel</span>
          </button>
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
              <VehicleSection
                vehicleTypeId={form.vehicleTypeId}
                onChange={set}
              />
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

            {/* CTA stack — Submit on top, Cancel below */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-sm font-medium rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Redirecting
                    to Khalti…
                  </>
                ) : (
                  <>
                    <CreditCard size={14} /> Pay & Ship — रु{" "}
                    {fareData
                      ? Number(fareData.totalFare).toLocaleString()
                      : "…"}
                  </>
                )}
              </button>

              <button
                onClick={handleCancel}
                disabled={submitting}
                className="
                  w-full py-2.5 rounded-xl text-sm font-medium
                  border border-zinc-300 dark:border-zinc-600
                  text-zinc-600 dark:text-zinc-300
                  hover:bg-zinc-100 dark:hover:bg-zinc-800
                  active:bg-zinc-200 dark:active:bg-zinc-700
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                Cancel
              </button>
            </div>
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

      {/* ── Dirty-form confirmation modal ──────────────────────── */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-200 dark:border-zinc-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">
              Discard shipment?
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              All entered details will be lost. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Keep editing
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 active:bg-red-700 text-white transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}