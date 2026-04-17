import { useState } from "react";
import { useAPI, apiPatch, apiPost } from "../../../shared/hooks/useApi";

export const useRiderDashboard = () => useAPI("/api/rider/dashboard");
export const useRiderManifest = () => useAPI("/api/rider/manifest");
export const useRiderEarnings = () => useAPI("/api/rider/earnings");

export function useToggleDuty() {
  const [loading, setLoading] = useState(false);
  const toggle = async (isOnline) => {
    setLoading(true);
    try {
      return await apiPatch("/api/rider/duty", { isOnline });
    } finally {
      setLoading(false);
    }
  };
  return { toggle, loading };
}

export function useScanPackage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const scan = async (trackingNumber, action) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiPost(`/api/shipments/${trackingNumber}/scan`, {
        action,
      });
      setResult(data);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };
  return { scan, loading, result, error };
}

export function useConfirmDelivery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const deliver = async (shipmentId, payload) => {
    setLoading(true);
    setError(null);
    try {
      return await apiPost(`/api/shipments/${shipmentId}/deliver`, payload);
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };
  return { deliver, loading, error };
}
