import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "../../context/ToastContext";

export const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const TIMEOUT_MS = 15000;

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

function makeFetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timeout)
  );
}

// ── useAPI hook ───────────────────────────────────────────────────────────────

export function useAPI(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

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
      const res = await makeFetchWithTimeout(`${API}${path}`, {
        headers: authHeaders(),
      });
      const json = await handleResponse(res);
      setData(json);
      return json;
    } catch (e) {
      const message =
        e.name === "AbortError"
          ? "Server is waking up, please try again."
          : (e.message ?? "Request failed");
      setError(message);
      toastRef.current({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [path]); // toast removed from deps — using ref instead

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
  try {
    const res = await makeFetchWithTimeout(url, {
      method: "GET",
      headers: authHeaders(),
    });
    return handleResponse(res);
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Server is waking up, please try again.");
    throw e;
  }
}

export async function apiPost(path, body) {
  try {
    const res = await makeFetchWithTimeout(`${API}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Server is waking up, please try again.");
    throw e;
  }
}

export async function apiPatch(path, body) {
  try {
    const res = await makeFetchWithTimeout(`${API}${path}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Server is waking up, please try again.");
    throw e;
  }
}

export async function apiPut(path, body) {
  try {
    const res = await makeFetchWithTimeout(`${API}${path}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Server is waking up, please try again.");
    throw e;
  }
}

export async function apiDelete(path) {
  try {
    const res = await makeFetchWithTimeout(`${API}${path}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleResponse(res);
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Server is waking up, please try again.");
    throw e;
  }
}

export async function apiPostForm(path, formData) {
  const token = localStorage.getItem("token");
  try {
    const res = await makeFetchWithTimeout(`${API}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      // No Content-Type — browser sets it automatically with the correct boundary
      body: formData,
    });
    return handleResponse(res);
  } catch (e) {
    if (e.name === "AbortError") throw new Error("Server is waking up, please try again.");
    throw e;
  }
}