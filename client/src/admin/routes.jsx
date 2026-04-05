import { Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminOverview from './pages/AdminOverview';
import VerifyUsers from './pages/VerifyUsers';
import FleetFares from './pages/FleetFares';
import Finance from './pages/Finance'; 
import Settlements from './pages/Settlement';
export const adminRoutes = {
  path: '/admin',
  element: <AdminLayout />,
  children: [
    { index: true,          element: <Navigate to="overview" replace /> },
    { path: 'overview',     element: <AdminOverview /> },
    { path: 'verify',       element: <VerifyUsers /> },
    { path: 'fleet',        element: <FleetFares /> },
    { path: 'finance',      element: <Finance /> },
    { path: 'settlements',  element: <Settlements /> },
  ],
};