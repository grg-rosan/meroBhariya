import { useState } from 'react';
import { useAPI, apiPost, apiPatch } from '../../shared/hooks/useApi';

// GET /api/dispatcher/shipments
export const useHubInventory = () => useAPI('/api/dispatcher/shipments');

// GET /api/dispatcher/riders/available?vehicleTypeId=
export const useAvailableRiders = (vehicleTypeId) =>
  useAPI(vehicleTypeId ? `/api/dispatcher/riders/available?vehicleTypeId=${vehicleTypeId}` : null);

// GET /api/dispatcher/shipments/stuck
export const useStuckPackages = () => useAPI('/api/dispatcher/shipments/stuck');

export function useScanIn() {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  // POST /api/dispatcher/shipments/:id/scan
  const scanIn = async (shipmentId, note = '') => {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await apiPost(`/api/dispatcher/shipments/${shipmentId}/scan`, { note });
      setResult(data); return data;
    } catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  };

  return { scanIn, loading, result, error };
}

export function useAssignRoute() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // PATCH /api/dispatcher/shipments/:id/assign
  const assign = async (shipmentId, riderId) => {
    setLoading(true); setError(null);
    try {
      return await apiPatch(`/api/dispatcher/shipments/${shipmentId}/assign`, { riderId });
    } catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  };

  return { assign, loading, error };
}