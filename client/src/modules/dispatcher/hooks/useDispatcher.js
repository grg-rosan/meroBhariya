// src/modules/dispatcher/hooks/useDispatcher.js
import { useState }                  from "react";
import { useAPI, apiPost, apiPatch } from "../../../shared/hooks/useApi";
import { useToast }                  from "../../../context/ToastContext";
import { useAuth }                   from "../../auth/AuthContext";

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
  const { user } = useAuth();
  const path =
    user?.role === "DISPATCHER" ? "/api/dispatcher/shipments/hub" : null;
  const result = useAPI(path);
  console.log("hub raw", result.data);
  return {
    ...result,
    shipments: result.data?.data?.shipments ?? [],
    stats:     result.data?.data?.stats     ?? {},
  };
};

export const useStuckPackages = () => {
  const result = useAPI("/api/dispatcher/shipments/stuck");
  const stuck = (result.data?.data ?? []).map((pkg) => {
    const hoursInHub = Math.round((pkg.stuckDurationMinutes ?? 0) / 60);
    return {
      ...pkg,
      hoursInHub,
      merchant: pkg.merchant?.businessName ?? "Unknown merchant",
      destination: pkg.deliveryAddress ?? "Unknown destination",
      reason: pkg.stuckReason,
    };
  });
  return {
    ...result,
    data: result.data ? { ...result.data, stuck } : null,
    packages: stuck,
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

export const usePickupQueue = (filters = {}) => {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v != null))
  ).toString();

  const path   = `/api/dispatcher/shipments/pickup-queue${params ? `?${params}` : ""}`;
  const result = useAPI(path);

  return {
    ...result,
    shipments: result.data?.shipments ?? [],
    total:     result.data?.total     ?? 0,
    refresh:   result.refetch,   // ← alias refetch → refresh
  };
};

export function useAssignRiderForPickup() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const assign = async (shipmentId, riderProfileId) => {
    setLoading(true);
    try {
      return await apiPatch(
        `/api/dispatcher/shipments/${shipmentId}/assign-pickup-rider`,
        { riderProfileId }
      );
    } catch (e) {
      toast({ message: e.message, type: "error" });
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { assign, loading };
}
