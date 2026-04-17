// src/shared/layouts/RootLayout.jsx
import { Outlet } from "react-router"; // or "react-router-dom" if not upgraded yet
import { AuthProvider } from "../../modules/auth/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Outlet />
      </NotificationProvider>
    </AuthProvider>
  );
}
