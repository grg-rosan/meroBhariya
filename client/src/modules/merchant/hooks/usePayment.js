// src/modules/merchant/hooks/usePayment.js
import { useState, useCallback } from "react";
import { apiPost, apiGet } from "../../../shared/hooks/useApi.js";

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // ── Initiate ──────────────────────────────────────────────
  // Calls POST /api/merchant/payment/initiate/:shipmentId
  // Then redirects to Khalti payment page
  const initiatePayment = useCallback(async (shipmentId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiPost(`/api/merchant/payment/initiate/${shipmentId}`);
      // Redirect to Khalti — user comes back to /merchant/payment/verify
      window.location.href = data.data.paymentUrl;
      return data.data;
    } catch (err) {
      const message = err.message ?? "Failed to initiate payment.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Verify ────────────────────────────────────────────────
  // Calls GET /api/merchant/payment/verify?pidx=xxx&shipmentId=xxx
  // Called automatically on the verify page after Khalti redirect
  const verifyPayment = useCallback(async ({ pidx }) => {  // ← no shipmentId
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/api/merchant/payment/verify", { pidx }); // ← no shipmentId
      return data.data;
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
    initiatePayment,
    verifyPayment,
  };
}