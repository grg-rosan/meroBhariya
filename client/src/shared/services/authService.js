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

async function getAuth(url) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Unauthorised");
  return data;
}

export const authAPI = {
  initiateRegistration: (role, payload) =>
  postJSON(`${API}/api/auth/register/initiate`, { role, ...payload }),

completeRegistration: (email, otp) =>
  postJSON(`${API}/api/auth/register/complete`, { email, otp }),

resendRegistrationOtp: (email) =>
  postJSON(`${API}/api/auth/register/resend-otp`, { email }),

  logout: () => postAuth(`${API}/api/auth/logout`).catch(() => {}),
  me: () => getAuth(`${API}/api/auth/me`),

  login: (email, password) =>
    postJSON(`${API}/api/auth/login`, { email, password }),

  sendOtp: (email) => postJSON(`${API}/api/auth/otp/send`, { email }),

  verifyOtp: (email, otp) =>
    postJSON(`${API}/api/auth/otp/verify`, { email, otp }),

  forgotPassword: (email) =>
    postJSON(`${API}/api/auth/password/forgot`, { email }),

  resetPassword: (email, resetCode, password) =>
    postJSON(`${API}/api/auth/password/reset`, {
      email,
      resetCode,
      newPassword: password,
    }),
};
