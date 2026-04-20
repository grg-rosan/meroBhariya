// COMPLETE FIXED FILE
import { useState } from 'react';
import { useAPI, apiPost, apiPatch, API } from '../../../shared/hooks/useApi';

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export const useMerchantDashboard = () => useAPI('/api/merchant/shipments');

// ─── Shipments list (paginated + filtered) ────────────────────────────────────
export const useShipments = (status = '', page = 1) =>
  useAPI(`/api/merchant/shipments?${new URLSearchParams({ ...(status && { status }), page, limit: 20 })}`, [status, page]);

// ─── Single shipment ──────────────────────────────────────────────────────────
export const useShipment = (id) => useAPI(`/merchant/shipments/${id}`);

// ─── COD ledger ───────────────────────────────────────────────────────────────
export const useCODLedger = () =>
  useAPI('/api/merchant/shipments/cod-ledger');

// ─── Create shipment ──────────────────────────────────────────────────────────
export function useCreateShipment() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const createShipment = async (payload) => {
    setLoading(true); setError(null);
    try { return await apiPost('/api/merchant/shipments', payload); }
    catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  };

  return { createShipment, loading, error };
}

// ─── Cancel shipment ──────────────────────────────────────────────────────────
export function useCancelShipment() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const cancelShipment = async (id) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/merchant/shipments/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }
    catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  };

  return { cancelShipment, loading, error };
}

// ─── Bulk upload ──────────────────────────────────────────────────────────────
export function useBulkUpload() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(null);

  const upload = async (file) => {
    setLoading(true); setResult(null); setError(null); setProgress(0);
    try {
      const form  = new FormData();
      form.append('file', file);
      const token = localStorage.getItem('token');
      const xhr   = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          setProgress(Math.round((e.loaded / e.total) * 100));
      };

      const data = await new Promise((res, rej) => {
        xhr.onload  = () => xhr.status < 300
          ? res(JSON.parse(xhr.responseText))
          : rej(new Error(`HTTP ${xhr.status}`));
        xhr.onerror = () => rej(new Error('Network error'));
        xhr.open('POST', `${API}/merchant/shipments/bulk`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(form);
      });

      setResult(data);
      return data;
    } catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  };

  return { upload, progress, loading, result, error };
}



