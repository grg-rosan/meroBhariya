import { API } from "../hooks/useApi";

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const authAPI = {
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
};