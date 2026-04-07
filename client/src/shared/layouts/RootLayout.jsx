// src/shared/layouts/RootLayout.jsx
import { Outlet } from "react-router"; // or "react-router-dom" if not upgraded yet
import { AuthProvider } from "../../auth/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
