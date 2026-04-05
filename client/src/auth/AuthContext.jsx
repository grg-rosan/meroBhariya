import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Role → home route mapping
export const ROLE_HOME = {
  ADMIN: "/admin/dashboard",
  MERCHANT: "/merchant/dashboard",
  RIDER: "/rider/dashboard",
  DISPATCHER: "/dispatcher/dashboard",
};

// ─── API helpers ────────────────────────────────────────────────────────────

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

// ─── Auth API calls ──────────────────────────────────────────────────────────

export const authAPI = {
  /** POST /api/auth/login → { token, user: { id, name, email, role } } */
  login: (email, password) =>
    postJSON(`${API_BASE}/auth/login`, { email, password }),

  /** POST /api/auth/logout  (best-effort, fire-and-forget) */
  logout: () => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.resolve();
    return fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  },

  /** GET /api/auth/me → { user }  – validates token & refreshes user data */
  me: () => {
    const token = localStorage.getItem("token");
    if (!token) return Promise.reject(new Error("No token"));
    return fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unauthorised");
      return data;
    });
  },
};

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { id, name, email, role }
  const [loading, setLoading] = useState(true); // true while validating stored token
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // On mount: validate any stored token
  useEffect(() => {
    authAPI
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const { token, user } = await authAPI.login(email, password);
      localStorage.setItem("token", token);
      setUser(user);
      navigate(ROLE_HOME[user.role] ?? "/", { replace: true });
    } catch (err) {
      setError(err.message);
      throw err; // let the form surface it too
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    await authAPI.logout();
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = { user, loading, error, login, logout, setError };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}