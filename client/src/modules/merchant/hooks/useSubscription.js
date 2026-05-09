// src/modules/merchant/hooks/useSubscription.js

import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "../../../shared/hooks/useApi";

export function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError]               = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]   = useState(null);

  const fetchSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/api/merchant/subscription");
      setSubscription(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const data = await apiGet("/api/merchant/subscription/plans"); // ✅ fixed
      setPlans(Array.isArray(data) ? data : data?.plans ?? []);
    } catch {
      // non-fatal
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
    fetchPlans();
  }, [fetchSubscription, fetchPlans]);

  const subscribeToPlan = useCallback(async (planId) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const data = await apiPost("/api/merchant/subscription", { planId });
      await fetchSubscription();
      return data;
    } catch (e) {
      setActionError(e.message);
      throw e;
    } finally {
      setActionLoading(false);
    }
  }, [fetchSubscription]);

  const isExpired         = subscription?.status === "EXPIRED";
  const hasNoSubscription = !subscription || subscription?.status === "NONE";
  const isOverQuota       =
    subscription?.status === "ACTIVE" &&
    subscription?.shipmentsUsed >= subscription?.shipmentQuota;

  const recommendedPlan = plans.find((p) => {
    if (!subscription?.plan) return true;
    return p.shipmentQuota > (subscription?.plan?.shipmentQuota ?? 0);
  });

  return {
    subscription, plans, loading, plansLoading,
    error, actionLoading, actionError,
    isExpired, hasNoSubscription, isOverQuota,
    recommendedPlan,
    refetch: fetchSubscription,
    subscribeToPlan,
  };
}