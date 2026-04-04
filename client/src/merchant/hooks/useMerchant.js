import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

function useAPI(path, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}${path}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        ...options,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Dashboard stats
export function useMerchantDashboard() {
  return useAPI('/api/merchant/dashboard');
}

// Paginated shipments with optional filter
export function useShipments(status = '', page = 1) {
  const query = new URLSearchParams({ ...(status && { status }), page, limit: 20 }).toString();
  return useAPI(`/api/shipments?${query}`);
}

// COD ledger / pending payments
export function useCODLedger() {
  return useAPI('/api/payments/pending');
}

// Create single shipment
export function useCreateShipment() {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const createShipment = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/shipments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { createShipment, loading, error };
}

// Bulk upload (CSV/Excel)
export function useBulkUpload() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(null);

  const upload = async (file) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setProgress(0);
    try {
      const token = localStorage.getItem('token');
      const form  = new FormData();
      form.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };

      const data = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
          else reject(new Error(`HTTP ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.open('POST', `${API}/api/shipments/bulk`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(form);
      });

      setResult(data);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { upload, progress, loading, result, error };
}

// Request pickup
export function useRequestPickup() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const requestPickup = async (shipmentIds) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/merchant/request-pickup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { requestPickup, loading, error };
}