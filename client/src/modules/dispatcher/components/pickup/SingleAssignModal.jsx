import { useState } from "react";
import { useAssignRiderForPickup } from "../../hooks/useDispatcher";
import { useRiderAssignment } from "../../hooks/useRiderAssignment";
import { useAppTheme } from "../../../../context/ThemeContext";
import Badge from "../shared/Badge";
import RiderSelectField from "../shared/RiderSelectField";
import ModalActions from "./AssignModalShared.jsx";

export default function SingleAssignModal({
  shipment,
  onClose,
  onAssigned,
}) {
  const { tokens: tk } = useAppTheme();
  const {
    riders,
    loading: ridersLoading,
    riderId,
    setRiderId,
  } = useRiderAssignment(shipment.vehicleType?.id);
  const { assign, loading: assigning } = useAssignRiderForPickup();
  const [err, setErr] = useState(null);

  async function handleAssign() {
    if (!riderId) return;
    setErr(null);
    try {
      await assign(shipment.id, riderId);
      onAssigned();
    } catch (e) {
      setErr(e.response?.data?.message ?? "Failed to assign rider.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`${tk.modalCard} border rounded-xl w-full max-w-md p-6 space-y-4`}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className={`${tk.text} font-semibold text-lg`}>Assign Rider</h2>
            <p className={`${tk.sub} text-sm mt-0.5`}>
              {shipment.trackingNumber} · {shipment.merchant?.businessName}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`${tk.sub} hover:${tk.text} text-xl leading-none`}
          >
            ×
          </button>
        </div>

        {/* Shipment summary */}
        <div className={`${tk.summary} rounded-lg p-3 text-sm space-y-1`}>
          <p>
            <span className={tk.sub}>Pickup from:</span>{" "}
            {shipment.merchant?.businessName}
          </p>
          <p>
            <span className={tk.sub}>Deliver to:</span>{" "}
            {shipment.deliveryAddress}
          </p>
          <p>
            <span className={tk.sub}>Weight:</span> {shipment.weight} kg
            {shipment.isFragile && (
              <Badge
                label="Fragile"
                className="bg-amber-500/20 text-amber-400 ml-2"
              />
            )}
          </p>
          <p>
            <span className={tk.sub}>Payment:</span>{" "}
            {shipment.paymentType === "COD"
              ? `COD — रू ${shipment.codAmount}`
              : "Prepaid"}
          </p>
        </div>

        <RiderSelectField
          riders={riders}
          loading={ridersLoading}
          value={riderId}
          onChange={(e) => setRiderId(e.target.value)}
          noRiderMsg={`No online riders for ${shipment.vehicleType?.name}.`}
          error={err}
          inputClass={tk.input}
          subClass={tk.sub}
        />

        <ModalActions
          onCancel={onClose}
          onConfirm={handleAssign}
          disabled={!riderId}
          loading={assigning}
          confirmLabel="Assign Rider"
          cancelClass={tk.cancelBtn}
        />
      </div>
    </div>
  );
}
