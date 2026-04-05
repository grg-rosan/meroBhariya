import { Navigate } from 'react-router-dom';
import RiderLayout from './components/RiderLayout';
import RiderDashboard from './pages/RiderDashboard';
import RiderEarnings from './pages/RiderEarnings';
import RiderManifest from './pages/RiderManifest';
import RiderNavigation from './pages/RiderNavigation';
import RiderScanner from './pages/RiderScanner';
export const riderRoutes = {
  path: '/rider',
  element: <RiderLayout />,
  children: [
    { index: true, element: <Navigate to="dashboard" replace /> },
    { path: 'dashboard',  element: <RiderDashboard /> },
    { path: 'manifest',   element: <RiderManifest /> },
    { path: 'scanner',    element: <RiderScanner /> },
    { path: 'navigation', element: <RiderNavigation /> },
    { path: 'earnings',   element: <RiderEarnings /> },
  ],
};