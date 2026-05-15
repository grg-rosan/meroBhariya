// src/modules/merchant/hooks/usePayment.js
import { useState, useCallback } from "react";
import { apiPost, apiGet } from "../../../shared/hooks/useApi.js";
import { useToast } from "../../../context/ToastContext";

export function usePayment() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initiatePayment = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      if (!payload || typeof payload !== "object") {
        throw new Error("Payment initiation requires a shipment payload.");
      }
      const data = await apiPost("/api/merchant/payment/initiate", payload);
      const session = data.data ?? data;
      toast({ message: "Redirecting to payment…", type: "info" });
      window.location.href = session.paymentUrl;
      return session;
    } catch (err) {
      const message = err.message ?? "Failed to initiate payment.";
      setError(message);
      toast({ message, type: "error" });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const initiateExistingPayment = useCallback(async (shipmentId) => {
    setLoading(true);
    setError(null);
    try {
      if (!shipmentId) {
        throw new Error("shipmentId is required.");
      }
      const data = await apiPost(`/api/merchant/payment/initiate/${shipmentId}`);
      const session = data.data ?? data;
      toast({ message: "Redirecting to payment…", type: "info" });
      window.location.href = session.paymentUrl;
      return session;
    } catch (err) {
      const message = err.message ?? "Failed to initiate payment.";
      setError(message);
      toast({ message, type: "error" });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const verifyPayment = useCallback(async ({ pidx }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/api/merchant/payment/verify", { pidx });
      const result = data.data ?? data;
      toast({ message: "Payment verified successfully.", type: "success" });
      return result;
    } catch (err) {
      const message = err.message ?? "Payment verification failed.";
      setError(message);
      toast({ message, type: "error" });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    error,
    initiateExistingPayment,
    initiatePayment,
    verifyPayment,
  };
}
