import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../../shared/services/authService";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      console.log(user)
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await authAPI.logout();
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const value = { user, loading, error, login, logout, setError };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}