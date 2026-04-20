import { useState } from "react";
import { useAPI, apiPost, apiPatch } from "../../../shared/hooks/useApi";
import { useToast } from "../../../shared/context/ToastContext";
export const useHubInventory = () => useAPI("/api/hub/inventory");
export const useAvailableRiders = () => useAPI("/api/hub/riders/available");
export const useStuckPackages = () => useAPI("/api/hub/stuck");

export function useScanIn() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const toast = useToast();
  const scanIn = async (trackingNumber, note = "") => {
    setLoading(true);
    setResult(null);
    try {
      const data = await apiPost("/api/hub/scan-in", { trackingNumber, note });
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

export function useAssignRoute() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const assign = async (shipmentIds, riderId) => {
    setLoading(true);
    try {
      return await apiPatch("/api/hub/assign-route", { shipmentIds, riderId });
    } catch (e) {
      toast({ message: e.message, type: "error" });
      throw e;
    } finally {
      setLoading(false);
    }
  };
  return { assign, loading };
}
