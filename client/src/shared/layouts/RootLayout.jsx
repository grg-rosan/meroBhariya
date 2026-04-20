// src/shared/layouts/RootLayout.jsx
import { Outlet } from "react-router"; // or "react-router-dom" if not upgraded yet
import { AuthProvider } from "../../modules/auth/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";
import ErrorBoundary from "../components/ErrorBoundary";
import { ToastProvider } from "../context/ToastContext";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <Outlet />
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
