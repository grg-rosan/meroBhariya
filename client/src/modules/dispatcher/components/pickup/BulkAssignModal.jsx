import { useState } from "react";
import { useAssignRiderForPickup } from "../../hooks/useDispatcher";
import { useRiderAssignment } from "../../hooks/useRiderAssignment";
import { useThemeTokens } from "../../../../shared/hooks/useTheme.js";
import RiderSelectField from "../shared/RiderSelectField";
import ModalActions from "./AssignModalShared.jsx";

export default function BulkAssignModal({
  shipments,
  dark,
  onClose,
  onAssigned,
}) {
  const tk = useThemeTokens(dark);
  const vehicleTypeId = shipments[0]?.vehicleType?.id ?? null;
  const {
    riders,
    loading: ridersLoading,
    riderId,
    setRiderId,
  } = useRiderAssignment(vehicleTypeId);
  const { assign, loading: assigning } = useAssignRiderForPickup();
  const [err, setErr] = useState(null);

  async function handleAssign() {
    if (!riderId || shipments.length === 0) return;
    setErr(null);
    try {
      for (const shipment of shipments) {
        await assign(shipment.id, riderId);
      }
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
        <div className="flex items-start justify-between">
          <div>
            <h2 className={`${tk.text} font-semibold text-lg`}>
              Bulk assign riders
            </h2>
            <p className={`${tk.sub} text-sm mt-0.5`}>
              {shipments.length} shipment{shipments.length !== 1 ? "s" : ""}{" "}
              selected
            </p>
          </div>
          <button
            onClick={onClose}
            className={`${tk.sub} hover:${tk.text} text-xl leading-none`}
          >
            ×
          </button>
        </div>

        <div className={`${tk.summary} rounded-lg p-3 text-sm space-y-1`}>
          <p>
            <span className={tk.sub}>Vehicle type:</span>{" "}
            {shipments[0]?.vehicleType?.name ?? "Any"}
          </p>
          <p>
            <span className={tk.sub}>Selected shipments:</span>{" "}
            {shipments.length}
          </p>
        </div>

        <RiderSelectField
          riders={riders}
          loading={ridersLoading}
          value={riderId}
          onChange={(e) => setRiderId(e.target.value)}
          noRiderMsg="No riders available for the selected shipments."
          error={err}
          inputClass={tk.input}
          subClass={tk.sub}
        />

        <ModalActions
          onCancel={onClose}
          onConfirm={handleAssign}
          disabled={!riderId}
          loading={assigning}
          confirmLabel="Assign riders"
          cancelClass={tk.cancelBtn}
        />
      </div>
    </div>
  );
}
