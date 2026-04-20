import { useState } from "react";
import { useAPI, apiPost, apiPatch, apiPut } from "../../../shared/hooks/useApi";
import { useToast } from "../../../shared/context/ToastContext";

// __________ Overview ____________________
export const useOverviewStats = () => useAPI("/api/admin/overview/stats");
export const useOverviewHealth = () => useAPI("/api/admin/overview/health");
export const useOverviewQuickActions = () => useAPI("/api/admin/overview/quick-actions");
export const useOverviewActivity = () => useAPI("/api/admin/overview/activity");

// __________Verify ____________________
export const usePendingMerchants = () => useAPI("/api/admin/verify/merchants");
export const usePendingRiders = () => useAPI("/api/admin/verify/riders");
export const useExpiredDocs = () => useAPI("/api/admin/verify/expired");

export function useReviewRiderDoc() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const review = async (docId, { status, note, expiresAt }) => {
    setLoading(true);
    try {
      return await apiPatch(`/api/admin/verify/rider-doc/${docId}`, { status, note, expiresAt });
    } catch (e) {
      toast({ message: e.message, type: "error" }); // ← fix
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { review, loading };
}

export function useReviewMerchantDoc() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const review = async (docId, { status, note }) => {
    setLoading(true);
    try {
      return await apiPatch(`/api/admin/verify/merchant-doc/${docId}`, { status, note });
    } catch (e) {
      toast({ message: e.message, type: "error" }); // ← fix
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { review, loading };
}

// ____________________ Fleet & fares ____________________
export const useVehicleTypes = () => useAPI("/api/admin/fleet/vehicle-types");
export const useFareConfigs = () => useAPI("/api/admin/fleet/fares");

export function useFareConfig(vehicleTypeId) {
  return useAPI(vehicleTypeId ? `/api/admin/fleet/fares/${vehicleTypeId}` : null);
}

export function useUpsertFare() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const upsert = async (vehicleTypeId, config) => {
    setLoading(true);
    try {
      return await apiPut(`/api/admin/fleet/fares/${vehicleTypeId}`, config);
    } catch (e) {
      toast({ message: e.message, type: "error" }); // ← fix
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { upsert, loading };
}

// __________Finance ____________________
export const useRevenueSummary = () => useAPI("/api/admin/finance/revenue");
export const useTransactions = () => useAPI("/api/admin/finance/transactions");
export const usePendingCOD = () => useAPI("/api/admin/finance/cod/pending");

export function useSettleCOD() {
  const [loading, setLoading] = useState(false);
  const toast = useToast(); 

  const settle = async (transactionId) => {
    setLoading(true);
    try {
      return await apiPatch(`/api/admin/finance/cod/${transactionId}/settle`);
    } catch (e) {
      toast({ message: e.message, type: "error" }); // ← add
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const settleAllForRider = async (riderId) => {
    setLoading(true);
    try {
      return await apiPost(`/api/admin/finance/cod/settle-rider/${riderId}`);
    } catch (e) {
      toast({ message: e.message, type: "error" }); // ← add
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { settle, settleAllForRider, loading };
}

// __________Settlements ____________________
export const useRiderSettlements = () => useAPI("/api/admin/settlements/riders");

export function useRiderSettlementDetail(riderId) {
  return useAPI(riderId ? `/api/admin/settlements/riders/${riderId}` : null);
}

export function useShipmentLogs(shipmentId) {
  return useAPI(shipmentId ? `/api/admin/settlements/shipment/${shipmentId}/logs` : null);
}