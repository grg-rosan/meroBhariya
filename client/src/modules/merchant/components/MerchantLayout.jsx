import { LayoutDashboard, ClipboardList, Package, Upload, Wallet, FileText, Bell, CreditCard } from 'lucide-react';
import RoleLayout from '../../../layouts/RoleLayout';
import { useNotifications } from "../../../context/NotificationContext";
import { useAuth } from '../../auth/AuthContext';
import { useMerchantNotifications } from '../hooks/useMerchantNotification.js';

export default function MerchantLayout() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  useMerchantNotifications();

  const NAV = [
    { to: '/merchant/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
    { to: '/merchant/shipments',    label: 'Shipments',     icon: Package },
    { to: '/merchant/bulk-upload',  label: 'Bulk upload',   icon: Upload },
    { to: '/merchant/cod-ledger',   label: 'COD ledger',    icon: Wallet },
    { to: '/merchant/manifests',    label: 'Manifests',     icon: ClipboardList },
    { to: '/merchant/documents',    label: 'Documents',     icon: FileText },
    { to: '/merchant/payment',      label: 'Subscription',  icon: CreditCard },
    {
      to: '/merchant/notifications',
      label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
      icon: Bell,
    },
  ];

  const name     = user?.name ?? user?.fullName ?? 'Merchant';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <RoleLayout
      role="Merchant"
      nav={NAV}
      accentClass="bg-rose-500"
      user={{ name, initials }}
    />
  );
}