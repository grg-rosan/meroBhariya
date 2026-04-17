import { useState } from 'react';
import { useAPI, apiPost, apiPatch } from '../../shared/hooks/useApi';
export const useHubInventory  = () => useAPI('/api/hub/inventory');
export const useAvailableRiders = () => useAPI('/api/hub/riders/available');
export const useStuckPackages = () => useAPI('/api/hub/stuck');

export function useScanIn() {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const scanIn = async (trackingNumber, note = '') => {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await apiPost('/api/hub/scan-in', { trackingNumber, note });
      setResult(data); return data;
    } catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  };
  return { scanIn, loading, result, error };
}

export function useAssignRoute() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const assign = async (shipmentIds, riderId) => {
    setLoading(true); setError(null);
    try { return await apiPatch('/api/hub/assign-route', { shipmentIds, riderId }); }
    catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  };
  return { assign, loading, error };
}