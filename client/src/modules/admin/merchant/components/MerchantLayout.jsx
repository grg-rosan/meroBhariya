import { LayoutDashboard, Package, Upload, Wallet, FileText } from 'lucide-react';
import RoleLayout from '../../shared/components/RoleLayout';

const NAV = [
  { to: '/merchant/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/merchant/shipments',   label: 'Shipments',   icon: Package },
  { to: '/merchant/bulk-upload', label: 'Bulk upload', icon: Upload },
  { to: '/merchant/cod-ledger',  label: 'COD ledger',  icon: Wallet },
  { to: '/merchant/manifests',   label: 'Manifests',   icon: FileText },
];

export default function MerchantLayout() {
  return (
    <RoleLayout
      role="Merchant"
      nav={NAV}
      accentClass="bg-rose-500"
      user={{ name: 'Himalayan Traders', initials: 'HT' }}
    />
  );
}