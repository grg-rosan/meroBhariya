import {
  LayoutDashboard,
  Boxes,
  GitBranch,
  ScanLine,
  AlertOctagon,
  Bell
} from "lucide-react";
import RoleLayout from "../../../layouts/RoleLayout";
import { useDispatcherNotifications } from "../hooks/useDispatcherNotification";
import { useAuth } from "../../auth/AuthContext";
import { initials } from "../../../shared/constants/staffConstants";


export default function DispatcherLayout() {
  const { user } = useAuth()
  const { unreadCount } = useDispatcherNotifications();
  const NAV = [
    { to: "/dispatcher/inventory", label: "Hub inventory", icon: Boxes },
    { to: "/dispatcher/assign", label: "Assign routes", icon: GitBranch },
    { to: "/dispatcher/scan-in", label: "Scan in", icon: ScanLine },
    { to: "/dispatcher/stuck", label: "Stuck packages", icon: AlertOctagon },
    {
      to: "/dispatcher/notifications",
      label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
      icon: Bell,
    },
  ];
  return (
    <RoleLayout
      role="Dispatcher"
      nav={NAV}
      accentClass="bg-emerald-500"
      user={{
        name: user?.fullName ?? "Rider",
        initials: initials(user?.fullName),
      }}
    />
  );
}
