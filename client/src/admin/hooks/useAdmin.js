import { useState } from 'react';
import { useAPI, apiPost, apiPatch } from '../../shared/hooks/useApi';
export const useAdminOverview    = () => useAPI('/api/admin/overview');
export const usePendingRiders    = () => useAPI('/api/admin/verify/riders');
export const usePendingMerchants = () => useAPI('/api/admin/verify/merchants');
export const useExpiredDocs      = () => useAPI('/api/admin/verify/expired');
export const useFinanceSummary   = () => useAPI('/api/admin/finance/summary');
export const useSettlements      = () => useAPI('/api/admin/settlements/pending');
export const useFareConfigs      = () => useAPI('/api/admin/fare-configs');
export const useVehicleTypes     = () => useAPI('/api/admin/vehicle-types');

export function useReviewRiderDoc() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const review = async (docId, { status, note, expiresAt }) => {
    setLoading(true); setError(null);
    try { return await apiPatch(`/api/admin/verify/rider-doc/${docId}`, { status, note, expiresAt }); }
    catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  };
  return { review, loading, error };
}

export function useReviewMerchantDoc() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const review = async (docId, { status, note }) => {
    setLoading(true); setError(null);
    try { return await apiPatch(`/api/admin/verify/merchant-doc/${docId}`, { status, note }); }
    catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  };
  return { review, loading, error };
}

export function useSettle() {
  const [loading, setLoading] = useState(false);
  const settle = async (merchantId) => {
    setLoading(true);
    try { return await apiPost('/api/admin/settle', { merchantId }); }
    finally { setLoading(false); }
  };
  return { settle, loading };
}

export function useUpdateFare() {
  const [loading, setLoading] = useState(false);
  const updateFare = async (vehicleTypeId, config) => {
    setLoading(true);
    try { return await apiPatch(`/api/admin/fare-configs/${vehicleTypeId}`, config); }
    finally { setLoading(false); }
  };
  return { updateFare, loading };
}