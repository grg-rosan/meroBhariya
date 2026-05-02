// src/modules/dispatcher/hooks/useDispatcher.js
import { useState }                  from "react";
import { useAPI, apiPost, apiPatch } from "../../../shared/hooks/useApi";
import { useToast }                  from "../../../context/ToastContext";

// ── Shipment hooks ────────────────────────────────────────────────────────────

export const usePendingShipments = () => {
  const result = useAPI("/api/dispatcher/shipments");
  return {
    ...result,
    shipments: result.data?.shipments ?? [],
    total:     result.data?.total     ?? 0,
  };
};

export const useHubInventory = () => {
  const result = useAPI("/api/dispatcher/shipments/hub");
  return {
    ...result,
    shipments: result.data?.data?.shipments ?? [],
    stats:     result.data?.data?.stats     ?? {},
  };
};

export const useStuckPackages = () => {
  const result = useAPI("/api/dispatcher/shipments/stuck");
  return {
    ...result,
    packages: result.data?.data ?? [],
  };
};

// ── Rider hooks ───────────────────────────────────────────────────────────────

export function useAvailableRiders(vehicleTypeId = null) {
  const path = vehicleTypeId
    ? `/api/dispatcher/riders/available?vehicleTypeId=${vehicleTypeId}`
    : `/api/dispatcher/riders/available`;
  const result = useAPI(path);
  return { ...result, riders: result.data ?? [] };
}

export function useNearestRiders({ lat, lng, vehicleTypeId = null } = {}) {
  const params = new URLSearchParams({
    lat, lng,
    ...(vehicleTypeId ? { vehicleTypeId } : {}),
  });
  const result = useAPI(lat && lng ? `/api/dispatcher/riders/nearest?${params}` : null);
  return { ...result, riders: result.data ?? [] };
}

// ── Assign hooks ──────────────────────────────────────────────────────────────

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

export function useBulkAssignRider() {
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const toast = useToast();

  const assignAll = async (shipmentIds, riderId) => {
    setLoading(true);
    setProgress(0);
    let successCount = 0;

    for (let i = 0; i < shipmentIds.length; i++) {
      try {
        await apiPatch(`/api/dispatcher/shipments/${shipmentIds[i]}/assign`, { riderId });
        successCount++;
      } catch {
        // individual errors — continue
      }
      setProgress(Math.round(((i + 1) / shipmentIds.length) * 100));
    }

    setLoading(false);
    setProgress(0);
    return successCount;
  };

  return { assignAll, loading, progress };
}

// ── Scan to hub ───────────────────────────────────────────────────────────────
// Single scan — no two-man rule. Accepts trackingNumber (from QR or manual input).

export function useScanToHub() {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const toast = useToast();

  const scan = async (trackingNumber) => {
    if (!trackingNumber?.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await apiPost(
        `/api/dispatcher/shipments/${trackingNumber.trim().toUpperCase()}/scan`
      );
      setResult(data?.data ?? data);
      return data;
    } catch (e) {
      setError(e.message);
      toast({ message: e.message, type: "error" });
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setError(null); };

  return { scan, loading, result, error, reset };
}

// ── Status update ─────────────────────────────────────────────────────────────

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