import { Navigate } from 'react-router-dom';
import MerchantLayout from './components/MerchantLayout';
import MerchantDashboard from './pages/MerchantDashboard';
import MerchantShipments from './pages/MerchantShipment';
import BulkUpload from './pages/BulkUpload';
import CODLedger from './pages/CODLedger';
import Manifests from './pages/Manifest';
import CreateShipment from './components/CreateShipment';
export const merchantRoutes = {
  path: '/merchant',
  element: <MerchantLayout />,
  children: [
    { index: true, element: <Navigate to="dashboard" replace /> },
    { path: 'dashboard',   element: <MerchantDashboard /> },
    { path: 'shipments',   element: <MerchantShipments /> },
    {path:'shipments/new', element: <CreateShipment /> },
    { path: 'bulk-upload', element: <BulkUpload /> },
    { path: 'cod-ledger',  element: <CODLedger /> },
    { path: 'manifests',   element: <Manifests /> },
  ],
};