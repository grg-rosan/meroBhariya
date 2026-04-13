// src/routes/index.jsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute, { PublicOnlyRoute } from "../auth/ProtectedRoute";
import LoginPage              from "../pages/auth/LoginPage";
import RegisterPage           from "../pages/auth/RegisterPage";
import RiderDocumentUpload    from "../rider/pages/RiderDocUpload";
import MerchantDocumentUpload from "../merchant/pages/MerchantDocUpload";
import { adminRoutes }      from "../admin/routes";
import { merchantRoutes }   from "../merchant/route";
import { riderRoutes }      from "../rider/routes";
import { dispatcherRoutes } from "../dispatcher/routes";
import LandingPage  from "../pages/landing/LandingPage";
import RootLayout   from "../shared/layouts/RootLayout";

function protect(allowedRoles, routeGroup) {
  return {
    element: <ProtectedRoute allowedRoles={allowedRoles} />,
    children: [routeGroup],
  };
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,       
    children: [
      { index: true, element: <LandingPage /> },

      {
        element: <PublicOnlyRoute />,
        children: [
          { path: "login",          element: <LoginPage /> },
          { path: "register",       element: <RegisterPage /> },
          { path: "register/:role", element: <RegisterPage /> },
        ],
      },

      {
        element: <ProtectedRoute allowedRoles={["RIDER"]} />,
        children: [{ path: "rider/documents", element: <RiderDocumentUpload /> }],
      },
      {
        element: <ProtectedRoute allowedRoles={["MERCHANT"]} />,
        children: [{ path: "merchant/documents", element: <MerchantDocumentUpload /> }],
      },

      protect(["ADMIN"],      adminRoutes),
      protect(["MERCHANT"],   merchantRoutes),
      protect(["RIDER"],      riderRoutes),
      protect(["DISPATCHER"], dispatcherRoutes),

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);