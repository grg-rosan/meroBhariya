// src/modules/merchant/hooks/useShipment.js

import { useState, } from "react";
import { useAPI, apiPost, apiDelete, API, authHeaders } from "../../../shared/hooks/useApi";

// ── Read hooks ────────────────────────────────────────────────────────────────

// useAPI doesn't accept a deps array — for filter/page changes we need
// to rebuild the path string so useAPI re-runs via its own useEffect on path change
export const useShipments = (status = "", page = 1) => {
  const result = useAPI(
    `/api/merchant/shipments?${new URLSearchParams({
      ...(status && { status }),
      page,
      limit: 20,
    }).toString()}`
  );
  const { success: _success, ...payload } = result.data ?? {};
  return { ...result, data: result.data ? payload : null };
};

export const useShipment = (id) => {
  const result = useAPI(id ? `/api/merchant/shipments/${id}` : null);
  return { ...result, data: result.data?.data ?? null };
};

export const useCODLedger = () => {
  const result = useAPI("/api/merchant/shipments/cod-ledger");
  return { ...result, data: result.data?.data ?? null };
};

// ── Create shipment ───────────────────────────────────────────────────────────

export function useCreateShipment() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const createShipment = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      return await apiPost("/api/merchant/shipments", payload);
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { createShipment, loading, error };
}

// ── Cancel shipment ───────────────────────────────────────────────────────────

export function useCancelShipment() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const cancelShipment = async (id) => {
    setLoading(true);
    setError(null);
    try {
      return await apiDelete(`/api/merchant/shipments/${id}`); // ✅ replaces raw fetch
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { cancelShipment, loading, error };
}

// ── Bulk upload ───────────────────────────────────────────────────────────────

export function useBulkUpload() {
  const [progress, setProgress]          = useState(0);
  const [loading, setLoading]            = useState(false);
  const [result, setResult]              = useState(null);
  const [error, setError]                = useState(null);
  const [validationErrors, setValErrors] = useState([]);

  const upload = async (file) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setValErrors([]);
    setProgress(0);

    try {
      const form = new FormData();
      form.append("file", file);
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
            if (json?.validationErrors) setValErrors(json.validationErrors);
            rej(new Error(json.message || `HTTP ${xhr.status}`));
          }
        };
        xhr.onerror = () => rej(new Error("Network error"));
        xhr.open("POST", `${API}/api/merchant/shipments/bulk`);
        xhr.setRequestHeader("Authorization", Authorization);
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

  const downloadTemplate = () => {
    const headers = [
      "receiverName", "receiverPhone", "deliveryAddress",
      "vehicleTypeId", "weight", "isFragile",
      "orderValue", "codAmount", "paymentType",
    ];
    const example = [
      "Ram Shrestha", "9841000001", "Thamel, Kathmandu",
      1, 0.5, "false", 500, 0, "PREPAID",
    ];
    const csv  = [headers.join(","), example.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "bulk_shipment_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return { upload, progress, loading, result, error, validationErrors, downloadTemplate };
}
