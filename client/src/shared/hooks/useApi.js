import { useState, useEffect, useCallback } from "react";
import { useToast } from "../context/ToastContext";

export const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
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
  const toast = useToast();

  const fetch_ = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}${path}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      toast(e.message);
    } finally {
      setLoading(false);
    }
  }, [path, toast]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);
  return { data, loading, refetch: fetch_ };
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
export const apiPut = async (path, body) => {
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
};
