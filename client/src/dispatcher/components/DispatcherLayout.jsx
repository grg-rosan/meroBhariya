import { LayoutDashboard, Boxes, GitBranch, ScanLine, AlertOctagon } from 'lucide-react';
import RoleLayout from '../../shared/components/RoleLayout';
import { useAuth } from '../../auth/AuthContext';
import { initials } from '../../shared/constants/staffConstants';

const NAV = [
  { to: '/dispatcher/inventory',  label: 'Hub inventory', icon: Boxes },
  { to: '/dispatcher/assign',     label: 'Assign routes', icon: GitBranch },
  { to: '/dispatcher/scan-in',    label: 'Scan in',       icon: ScanLine },
  { to: '/dispatcher/stuck',      label: 'Stuck packages',icon: AlertOctagon },
];

export default function DispatcherLayout() {
  const {user}  = useAuth()
  return (
    <RoleLayout
      role={user?.role ?? "Dispatcher"}
      nav={NAV}
      accentClass="bg-emerald-500"
      user={{ name:user?.fullName ?? "dispatcher", initials: initials(user?.fullName) }}
    />
  );
}