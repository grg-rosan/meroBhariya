import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, ROLE_HOME } from "./AuthContext";

/**
 * <ProtectedRoute allowedRoles={["ADMIN"]} />
 *
 * - Unauthenticated  → redirect to /login (with `from` state for post-login redirect)
 * - Wrong role       → redirect to the user's own home
 * - Correct role     → render <Outlet />
 *
 * Usage in route config:
 *   {
 *     element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
 *     children: [ ...adminRoutes ]
 *   }
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait for token validation before making any decision
  if (loading) return <PageLoader />;

  // Not logged in → go to login, remember where they wanted to go
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → send to their own home
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? "/"} replace />;
  }

  return <Outlet />;
}

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