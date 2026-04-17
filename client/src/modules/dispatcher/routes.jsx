import { Navigate } from 'react-router-dom';
import DispatcherLayout from './components/DispatcherLayout';
import HubInventory from './pages/HubInventory';
import AssignRoutes from './pages/AssignRoutes';
import ScanIn from './pages/ScanIn';
import StuckPackages from './pages/StuckPackages';

export const dispatcherRoutes = {
  path: '/dispatcher',
  element: <DispatcherLayout />,
  children: [
    { index: true,           element: <Navigate to="inventory" replace /> },
    { path: 'inventory',     element: <HubInventory /> },
    { path: 'assign',        element: <AssignRoutes /> },
    { path: 'scan-in',       element: <ScanIn /> },
    { path: 'stuck',         element: <StuckPackages /> },
  ],
};