import { LayoutDashboard, Boxes, GitBranch, ScanLine, AlertOctagon } from 'lucide-react';
import RoleLayout from '../../shared/components/RoleLayout';

const NAV = [
  { to: '/dispatcher/inventory',  label: 'Hub inventory', icon: Boxes },
  { to: '/dispatcher/assign',     label: 'Assign routes', icon: GitBranch },
  { to: '/dispatcher/scan-in',    label: 'Scan in',       icon: ScanLine },
  { to: '/dispatcher/stuck',      label: 'Stuck packages',icon: AlertOctagon },
];

export default function DispatcherLayout() {
  return (
    <RoleLayout
      role="Dispatcher"
      nav={NAV}
      accentClass="bg-emerald-500"
      user={{ name: 'Balaju Hub', initials: 'BH' }}
    />
  );
}