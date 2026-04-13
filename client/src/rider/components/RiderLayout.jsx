import { LayoutDashboard, ClipboardList, ScanLine, MapPin, Banknote, FileText, Bell } from 'lucide-react';
import RoleLayout from '../../shared/components/RoleLayout';
import { useAuth } from '../../auth/AuthContext';
import { useNotifications } from '../../shared/context/NotificationContext';

export default function RiderLayout() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const NAV = [
    { to: '/rider/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
    { to: '/rider/manifest',       label: 'Manifest',       icon: ClipboardList },
    { to: '/rider/scanner',        label: 'Scanner',        icon: ScanLine },
    { to: '/rider/navigation',     label: 'Navigate',       icon: MapPin },
    { to: '/rider/earnings',       label: 'Earnings',       icon: Banknote },
    { to: '/rider/documents',      label: 'Documents',      icon: FileText },
    { to: '/rider/notifications',  label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: Bell },
  ];

  return (
    <RoleLayout
      role={user?.role ?? 'Rider'}
      nav={NAV}
      accentClass="bg-sky-500"
      user={{
        name: user?.fullName ?? 'Rider',
        initials: user?.fullName?.split(' ').map(n => n[0]).join('') ?? 'R'
      }}
    />
  );
}