import { useState, useEffect, useCallback } from "react";
import { useToast } from "../../context/ToastContext";

export const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
    "Content-Type": "application/json",
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

export function useAPI(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetch_ = useCallback(async () => {
    if (!path) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}${path}`, { headers: authHeaders() });
      const json = await handleResponse(res);
      setData(json);
      return json;
    } catch (e) {
      const message = e.message ?? "Request failed";
      setError(message);
      toast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [path, toast]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}

// ── Standalone fetch helpers ──────────────────────────────────────────────────

export async function apiGet(path, params) {
  const url = params
    ? `${API}${path}?${new URLSearchParams(params).toString()}`
    : `${API}${path}`;
  const res = await fetch(url, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
}
export async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiPatch(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiPut(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiDelete(path) {
  const res = await fetch(`${API}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function apiPostForm(path, formData) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    // No Content-Type — browser sets it automatically with the correct boundary
    body: formData,
  });
  return handleResponse(res);
}
