// src/auth/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, ROLE_HOME } from "./AuthContext";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? "/"} replace />;
  }

  return <Outlet />;
}

// ── Add this ──────────────────────────────────────────────────────────────────
// Wraps public-only routes (/login, /register)
// If user is already logged in → send them to their dashboard
export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (user)    return <Navigate to={ROLE_HOME[user.role] ?? "/"} replace />;

  return <Outlet />;
}
// ─────────────────────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0f0f0f",
        color: "#fff",
        fontFamily: "monospace",
        fontSize: "0.9rem",
        letterSpacing: "0.05em",
      }}
    >
      Verifying session…
    </div>
  );
}