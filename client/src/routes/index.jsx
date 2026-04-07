// src/App.jsx
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import ProtectedRoute, {PublicOnlyRoute} from "../auth/ProtectedRoute";
import LoginPage from "../pages/auth/LoginPage"
import RegisterPage from "../pages/auth/RegisterPage";
import RiderDocumentUpload from "../rider/pages/RiderDocUpload";
import MerchantDocumentUpload from "../merchant/pages/MerchantDocUpload";
import { adminRoutes } from "../admin/routes";
import { merchantRoutes } from "../merchant/route";
import { riderRoutes } from "../rider/routes";
import { dispatcherRoutes } from "../dispatcher/routes";
import LandingPage from "../pages/landing/LandingPage";
import RootLayout from "../shared/layouts/RootLayout";
import { AuthProvider } from "../auth/AuthContext";

function protect(allowedRoles, routeGroup) {
  return {
    element: <ProtectedRoute allowedRoles={allowedRoles} />,
    children: [routeGroup],
  };
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // 1. Landing Page (Public)
      { index: true, element: <LandingPage /> },

      // 2. Auth Routes (Logged-out only)
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
          { path: "register/:role", element: <RegisterPage /> },
        ],
      },

      // 3. Document Uploads (Protected)
      {
        element: <ProtectedRoute allowedRoles={["RIDER"]} />,
        children: [
          { path: "rider/documents", element: <RiderDocumentUpload /> },
        ],
      },
      {
        element: <ProtectedRoute allowedRoles={["MERCHANT"]} />,
        children: [
          { path: "merchant/documents", element: <MerchantDocumentUpload /> },
        ],
      },

      // 4. Role-based Route Groups
      protect(["ADMIN"], adminRoutes),
      protect(["MERCHANT"], merchantRoutes),
      protect(["RIDER"], riderRoutes),
      protect(["DISPATCHER"], dispatcherRoutes),

      // 5. Fallback
      { path: "*", element: <Navigate to="/login" replace /> },
    ],
  },
]);
export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />;
    </AuthProvider>
  );
}
