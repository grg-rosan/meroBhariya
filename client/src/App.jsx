import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { merchantRoutes } from './merchant/route';
// import { riderRoutes }     from './rider/routes';      // coming next
// import { adminRoutes }     from './admin/routes';      // coming next
// import { dispatcherRoutes } from './dispatcher/routes'; // coming next

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/merchant/dashboard" replace /> },
  merchantRoutes,
  // riderRoutes,
  // adminRoutes,
  // dispatcherRoutes,
]);

export default function App() {
  return <RouterProvider router={router} />;
}