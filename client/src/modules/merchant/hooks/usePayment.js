// src/modules/merchant/hooks/usePayment.js
import { useState, useCallback } from "react";
import { apiPost, apiGet } from "../../../shared/hooks/useApi.js";

export function usePayment() {
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
      window.location.href = session.paymentUrl;
      return session;
    } catch (err) {
      const message = err.message ?? "Failed to initiate payment.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const initiateExistingPayment = useCallback(async (shipmentId) => {
    setLoading(true);
    setError(null);
    try {
      if (!shipmentId) {
        throw new Error("shipmentId is required.");
      }
      const data = await apiPost(`/api/merchant/payment/initiate/${shipmentId}`);
      const session = data.data ?? data;
      window.location.href = session.paymentUrl;
      return session;
    } catch (err) {
      const message = err.message ?? "Failed to initiate payment.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPayment = useCallback(async ({ pidx }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/api/merchant/payment/verify", { pidx });
      return data.data ?? data;
    } catch (err) {
      const message = err.message ?? "Payment verification failed.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    initiateExistingPayment,
    initiatePayment,
    verifyPayment,
  };
}
