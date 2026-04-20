import { useState } from "react";
import { useAPI, apiPatch, apiPost } from "../../../shared/hooks/useApi";
import { useToast } from "../../../shared/context/ToastContext";

export const useRiderDashboard = () => useAPI("/api/rider/dashboard");
export const useRiderManifest = () => useAPI("/api/rider/manifest");
export const useRiderEarnings = () => useAPI("/api/rider/earnings");

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
  const toast = useToast()
  const scan = async (trackingNumber, action) => {
    setLoading(true);
    setResult(null);
    try {
      const data = await apiPost(`/api/shipments/${trackingNumber}/scan`, {
        action,
      });
      setResult(data);
      return data;
    } catch (e) {
      toast({message:e.message,type:"error" });
      throw e;
    } finally {
      setLoading(false);
    }
  };
  return { scan, loading, result,  };
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
