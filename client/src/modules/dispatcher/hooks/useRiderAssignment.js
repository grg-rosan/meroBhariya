import { useState } from "react";
import { useAvailableRiders } from "./useDispatcher";

/**
 * useRiderAssignment
 * Encapsulates the rider-selection state shared by both assign flows
 * (AssignRoutes and the pickup-queue modals).
 *
 * @param {string|number} vehicleTypeId  – passed straight to useAvailableRiders
 */
export function useRiderAssignment(vehicleTypeId) {
  const { riders, loading } = useAvailableRiders(vehicleTypeId);
  const [riderId, setRiderId] = useState("");

  const selectedRider = riders.find((r) => r.id === riderId) ?? null;

  const reset = () => setRiderId("");

  return { riders, loading, riderId, setRiderId, selectedRider, reset };
}