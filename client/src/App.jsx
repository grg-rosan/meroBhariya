// src/App.jsx
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import {router} from "./routes/index"
export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}