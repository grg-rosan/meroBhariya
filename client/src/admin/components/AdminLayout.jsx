import { LayoutDashboard, UserCheck, Truck, PiggyBank, Landmark } from 'lucide-react';
import RoleLayout from '../../shared/components/RoleLayout';

const NAV = [
  { to: '/admin/overview',   label: 'Overview',      icon: LayoutDashboard },
  { to: '/admin/verify',     label: 'Verify users',  icon: UserCheck },
  { to: '/admin/fleet',      label: 'Fleet & fares', icon: Truck },
  { to: '/admin/finance',    label: 'Finance',       icon: PiggyBank },
  { to: '/admin/settlements',label: 'Settlements',   icon: Landmark },
];

export default function AdminLayout() {
  return (
    <RoleLayout
      role="Admin"
      nav={NAV}
      accentClass="bg-violet-500"
      user={{ name: 'Super Admin', initials: 'SA' }}
    />
  );
}