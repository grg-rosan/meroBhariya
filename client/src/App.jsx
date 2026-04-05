// src/App.jsx
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { AuthProvider }  from "./auth/AuthContext";
import ProtectedRoute    from "./auth/ProtectedRoute";
import RootLayout from "./shared/layouts/RootLayout";

import LoginPage              from "./pages/auth/LoginPage";
import RegisterPage           from "./pages/auth/RegisterPage";
import RiderDocumentUpload from "./rider/pages/RiderDocUpload";
import MerchantDocumentUpload from "./merchant/pages/MerchantDocUpload";
import { adminRoutes }      from "./admin/routes";
import { merchantRoutes }   from "./merchant/route";
import { riderRoutes }      from "./rider/routes";
import { dispatcherRoutes } from "./dispatcher/routes";

function protect(allowedRoles, routeGroup) {
  return {
    element: <ProtectedRoute allowedRoles={allowedRoles} />,
    children: [routeGroup],
  };
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/",               element: <Navigate to="/login" replace /> },
      { path: "/login",          element: <LoginPage /> },
      { path: "/register",       element: <RegisterPage /> },
      { path: "/register/:role", element: <RegisterPage /> },

      {
        element: <ProtectedRoute allowedRoles={["RIDER"]} />,
        children: [{ path: "/rider/documents", element: <RiderDocumentUpload /> }],
      },
      {
        element: <ProtectedRoute allowedRoles={["MERCHANT"]} />,
        children: [{ path: "/merchant/documents", element: <MerchantDocumentUpload /> }],
      },

      protect(["ADMIN"],      adminRoutes),
      protect(["MERCHANT"],   merchantRoutes),
      protect(["RIDER"],      riderRoutes),
      protect(["DISPATCHER"], dispatcherRoutes),

      { path: "*", element: <Navigate to="/login" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}