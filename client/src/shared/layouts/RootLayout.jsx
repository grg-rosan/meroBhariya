// src/shared/layouts/RootLayout.jsx
import { Outlet } from "react-router"; // or "react-router-dom" if not upgraded yet

export default function RootLayout() {
  return (
      <Outlet />
  );
}
