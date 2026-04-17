// src/shared/services/authService.js
import { API } from "../hooks/useApi";

async function postJSON(url, body = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

async function postAuth(url, body = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const authAPI = {
  // ─── Core auth ───────────────────────────────────────────
  login: (email, password) =>
    postJSON(`${API}/api/auth/login`, { email, password }),

  logout: () => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve();
    return fetch(`${API}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  },

  me: () => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.reject(new Error("No token"));
    return fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unauthorised");
      return data;
    });
  },

  // ─── OTP ─────────────────────────────────────────────────
  // POST /api/auth/otp/send  — public, no token needed
  // body: { email }
  // server sends SMS to the email number
  sendOtp: (email) =>
    postJSON(`${API}/api/auth/otp/send`, { email }),

  // POST /api/auth/otp/verify  — public, no token needed
  // body: { email, otp }
  // returns: { verified: true } or throws
  verifyOtp: (email, otp) =>
    postJSON(`${API}/api/auth/otp/verify`, { email, otp }),

  // ─── Password reset ───────────────────────────────────────
  // POST /api/auth/password/forgot  — public
  // body: { email }
  // server emails a reset link containing ?token=xxx
  forgotPassword: (email) =>
    postJSON(`${API}/api/auth/password/forgot`, { email }),

  // POST /api/auth/password/reset  — public
  // body: { token, newPassword }
  // token comes from URL: new URLSearchParams(location.search).get("token")
  resetPassword: (token, newPassword) =>
    postJSON(`${API}/api/auth/password/reset`, { token, newPassword }),
};