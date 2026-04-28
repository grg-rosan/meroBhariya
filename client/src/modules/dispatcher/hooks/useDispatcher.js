// src/modules/dispatcher/hooks/useDispatcher.js
import { useState }                        from "react";
import { useAPI, apiPost, apiPatch }        from "../../../shared/hooks/useApi";
import { useToast }                         from "../../../context/ToastContext";

// ── Data hooks ────────────────────────────────────────────────────────────────

// PENDING shipments — dispatcher assignment board
export const usePendingShipments = () => {
  const result = useAPI("/api/dispatcher/shipments");
  return { ...result, data: result.data ?? null };
};

// IN_HUB / ASSIGNED / OUT_FOR_DELIVERY — hub inventory
export const useHubInventory = () => {
  const result = useAPI("/api/dispatcher/shipments/hub");
  return { ...result, data: result.data?.data ?? null };
};

export const useStuckPackages = () => {
  const result = useAPI("/api/dispatcher/shipments/stuck");
  return { ...result, data: result.data?.data ?? null };
};

// Available riders — requires vehicleTypeId query param
export function useAvailableRiders(vehicleTypeId) {
  const result = useAPI(
    vehicleTypeId ? `/api/dispatcher/riders/available?vehicleTypeId=${vehicleTypeId}` : null
  );
  // Backend returns array directly
  return { ...result, data: result.data ?? [] };
}

// ── Assign rider to a single shipment ────────────────────────────────────────

export function useAssignRider() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const assign = async (shipmentId, riderId) => {
    setLoading(true);
    try {
      return await apiPatch(`/api/dispatcher/shipments/${shipmentId}/assign`, { riderId });
    } catch (e) {
      toast({ message: e.message, type: "error" });
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { assign, loading };
}

// ── Scan handoff (two-man rule) ───────────────────────────────────────────────

export function useScanIn() {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const toast = useToast();

  const scanIn = async (trackingNumber) => {
    setLoading(true);
    setResult(null);
    try {
      // Backend expects shipmentId — first resolve by tracking number
      const data = await apiPost(`/api/dispatcher/shipments/${trackingNumber}/scan`);
      setResult(data);
      return data;
    } catch (e) {
      toast({ message: e.message, type: "error" });
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { scanIn, loading, result };
}

// ── Update shipment status ────────────────────────────────────────────────────

export function useUpdateStatus() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const update = async (shipmentId, status) => {
    setLoading(true);
    try {
      return await apiPatch(`/api/dispatcher/shipments/${shipmentId}/status`, { status });
    } catch (e) {
      toast({ message: e.message, type: "error" });
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading };
}