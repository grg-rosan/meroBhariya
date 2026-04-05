
import { LayoutDashboard, ClipboardList, ScanLine, MapPin, Banknote } from 'lucide-react';
import RoleLayout from '../../shared/components/RoleLayout';

const NAV = [
  { to: '/rider/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { to: '/rider/manifest',   label: 'Manifest',  icon: ClipboardList },
  { to: '/rider/scanner',    label: 'Scanner',   icon: ScanLine },
  { to: '/rider/navigation', label: 'Navigate',  icon: MapPin },
  { to: '/rider/earnings',   label: 'Earnings',  icon: Banknote },
];

export default function RiderLayout() {
  return (
    <RoleLayout
      role="Rider"
      nav={NAV}
      accentClass="bg-sky-500"
      user={{ name: 'Rajan Shrestha', initials: 'RS' }}
    />
  );
}