// src/merchant/hooks/useShipmentHooks.js
import { useState } from 'react';
import { useAPI, apiPost, API, authHeaders } from '../../../shared/hooks/useApi';

export const useShipments = (status = '', page = 1) =>
  useAPI(
    `/api/merchant/shipments?${new URLSearchParams({
      ...(status && { status }),
      page,
      limit: 20,
    })}`,
    [status, page]
  );

export const useShipment = (id) =>
  useAPI(`/api/merchant/shipments/${id}`);

export const useCODLedger = () =>
  useAPI('/api/merchant/shipments/cod-ledger');

export function useCreateShipment() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const createShipment = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      return await apiPost('/api/merchant/shipments', payload);
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { createShipment, loading, error };
}

export function useCancelShipment() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const cancelShipment = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/merchant/shipments/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { cancelShipment, loading, error };
}

export function useBulkUpload() {
  const [progress, setProgress]           = useState(0);
  const [loading, setLoading]             = useState(false);
  const [result, setResult]               = useState(null);
  const [error, setError]                 = useState(null);
  const [validationErrors, setValErrors]  = useState([]); // per-row errors from server

  const upload = async (file) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setValErrors([]);
    setProgress(0);

    try {
      const form = new FormData();
      form.append('file', file);
      const { Authorization } = authHeaders();
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          setProgress(Math.round((e.loaded / e.total) * 100));
      };

      const data = await new Promise((res, rej) => {
        xhr.onload = () => {
          const json = JSON.parse(xhr.responseText);
          if (xhr.status < 300) {
            res(json);
          } else {
            // surface per-row validation errors if present
            if (json?.validationErrors) {
              setValErrors(json.validationErrors);
            }
            rej(new Error(json.message || `HTTP ${xhr.status}`));
          }
        };
        xhr.onerror = () => rej(new Error('Network error'));
        xhr.open('POST', `${API}/api/merchant/shipments/bulk`);
        xhr.setRequestHeader('Authorization', Authorization);
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

  // helper to download the template
  const downloadTemplate = () => {
    const headers = [
      'receiverName', 'receiverPhone', 'deliveryAddress',
      'vehicleTypeId', 'weight', 'isFragile',
      'orderValue', 'codAmount', 'paymentType',
    ];
    const example = [
      'Ram Shrestha', '9841000001', 'Thamel, Kathmandu',
      1, 0.5, 'false', 500, 0, 'PREPAID',
    ];

    // build CSV — no xlsx dependency needed on frontend
    const csv = [headers.join(','), example.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'bulk_shipment_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return { upload, progress, loading, result, error, validationErrors, downloadTemplate };
}