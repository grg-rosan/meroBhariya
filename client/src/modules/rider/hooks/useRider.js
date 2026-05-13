import { useState } from "react";
import { useAPI, apiPatch, apiPost } from "../../../shared/hooks/useApi";
import { useToast } from "../../../context/ToastContext";


export function useToggleDuty() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const toggle = async (isOnline) => {
    setLoading(true);
    try {
      return await apiPatch("/api/rider/duty", { isOnline });
    } catch (e) {
      toast({ message: e.message, type: "error" }); 
      throw e;
    }finally {
      setLoading(false);
    }
  };
  return { toggle, loading };
}

export function useScanPackage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const toast = useToast();
  const scan = async (trackingNumber, action) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiPost(`/api/shipments/${trackingNumber}/scan`, {
        action,
      });
      const payload = data?.data ?? data;
      setResult(payload);
      return payload;
    } catch (e) {
      const msg = e.message ?? "Scan failed";
      setError(msg);
      toast({ message: msg, type: "error" });
      throw e;
    } finally {
      setLoading(false);
    }
  };
  const reset = () => {
    setResult(null);
    setError(null);
  };
  return { scan, loading, result, error, reset };
}

export function useConfirmDelivery() {
  const [loading, setLoading] = useState(false);
  const toast = useToast()
  const deliver = async (shipmentId, payload) => {
    setLoading(true);
    try {
      return await apiPost(`/api/shipments/${shipmentId}/deliver`, payload);
    } catch (e) {
  toast({ message: e.message, type: "error" });      throw e;
    } finally {
      setLoading(false);
    }
  };
  return { deliver, loading};
}
// src/modules/rider/hooks/useRider.js
export const useRiderDashboard = () => {
  const result = useAPI("/api/rider/dashboard");
  return { ...result, data: result.data?.data ?? null };
};

export const useRiderManifest = () => {
  const result = useAPI("/api/rider/manifest");
  return { ...result, data: result.data?.data ?? result.data ?? null };
};

export const useRiderEarnings = () => {
  const result = useAPI("/api/rider/earnings");
  return { ...result, data: result.data?.data ?? null };
};