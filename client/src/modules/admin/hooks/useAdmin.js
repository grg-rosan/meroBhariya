// src/admin/hooks/useAdmin.js
import { useState } from "react";
import {
  useAPI,
  apiPost,
  apiPatch,
  apiPut,
} from "../../../shared/hooks/useApi";

// ─── Overview ─────────────────────────────────────────────────────────────────
export const useOverviewStats = () => useAPI("/api/admin/overview/stats");
export const useOverviewHealth = () => useAPI("/api/admin/overview/health");
export const useOverviewQuickActions = () =>
  useAPI("/api/admin/overview/quick-actions");
export const useOverviewActivity = () => useAPI("/api/admin/overview/activity");

// ─── Verify ───────────────────────────────────────────────────────────────────
export const usePendingMerchants = () => useAPI("/api/admin/verify/merchants");
export const usePendingRiders = () => useAPI("/api/admin/verify/riders");
export const useExpiredDocs = () => useAPI("/api/admin/verify/expired");

export function useReviewRiderDoc() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const review = async (docId, { status, note, expiresAt }) => {
    setLoading(true);
    setError(null);
    try {
      return await apiPatch(`/api/admin/verify/rider-doc/${docId}`, {
        status,
        note,
        expiresAt,
      });
    } catch (e) {
      setError(e.response?.data?.message ?? e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { review, loading, error };
}

export function useReviewMerchantDoc() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const review = async (docId, { status, note }) => {
    setLoading(true);
    setError(null);
    try {
      return await apiPatch(`/api/admin/verify/merchant-doc/${docId}`, {
        status,
        note,
      });
    } catch (e) {
      setError(e.response?.data?.message ?? e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { review, loading, error };
}

// ─── Fleet & fares ────────────────────────────────────────────────────────────
export const useVehicleTypes = () => useAPI("/api/admin/fleet/vehicle-types");
export const useFareConfigs = () => useAPI("/api/admin/fleet/fares");

export function useFareConfig(vehicleTypeId) {
  return useAPI(
    vehicleTypeId ? `/api/admin/fleet/fares/${vehicleTypeId}` : null,
  );
}

export function useUpsertFare() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const upsert = async (vehicleTypeId, config) => {
    setLoading(true);
    setError(null);
    try {
      return await apiPut(`/api/admin/fleet/fares/${vehicleTypeId}`, config);
    } catch (e) {
      setError(e.response?.data?.message ?? e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { upsert, loading, error };
}

// ─── Finance ──────────────────────────────────────────────────────────────────
export const useRevenueSummary = () => useAPI("/api/admin/finance/revenue");
export const useTransactions = () => useAPI("/api/admin/finance/transactions");
export const usePendingCOD = () => useAPI("/api/admin/finance/cod/pending");

export function useSettleCOD() {
  const [loading, setLoading] = useState(false);

  const settle = async (transactionId) => {
    setLoading(true);
    try {
      return await apiPatch(`/api/admin/finance/cod/${transactionId}/settle`);
    } finally {
      setLoading(false);
    }
  };

  const settleAllForRider = async (riderId) => {
    setLoading(true);
    try {
      return await apiPost(`/api/admin/finance/cod/settle-rider/${riderId}`);
    } finally {
      setLoading(false);
    }
  };

  return { settle, settleAllForRider, loading };
}

// ─── Settlements ──────────────────────────────────────────────────────────────
export const useRiderSettlements = () =>
  useAPI("/api/admin/settlements/riders");

export function useRiderSettlementDetail(riderId) {
  return useAPI(riderId ? `/api/admin/settlements/riders/${riderId}` : null);
}

export function useShipmentLogs(shipmentId) {
  return useAPI(
    shipmentId ? `/api/admin/settlements/shipment/${shipmentId}/logs` : null,
  );
}
