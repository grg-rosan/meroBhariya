import { useState } from 'react';
import { useAPI,apiPatch,apiPost } from '../../shared/hooks/useApi';
export const useAdminOverview   = () => useAPI('/api/admin/overview');
export const usePendingUsers    = () => useAPI('/api/admin/users/pending');
export const useFinanceSummary  = () => useAPI('/api/admin/finance/summary');
export const useSettlements     = () => useAPI('/api/admin/settlements/pending');
export const useFareConfigs     = () => useAPI('/api/admin/fare-configs');
export const useVehicleTypes    = () => useAPI('/api/admin/vehicle-types');

export function useVerifyUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const verify = async (userId, action, note = '') => {
    setLoading(true); setError(null);
    try { return await apiPost('/api/admin/verify-user', { userId, action, note }); }
    catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  };
  return { verify, loading, error };
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