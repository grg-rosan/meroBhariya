import {
  LayoutDashboard,
  UserCheck,
  Truck,
  PiggyBank,
  Landmark,
  Users,
} from "lucide-react";
import RoleLayout from "../../../shared/components/RoleLayout";
import { useAuth } from "../../auth/AuthContext";
import { initials } from "../../../shared/constants/staffConstants";

export default function AdminLayout() {
  const { user } = useAuth();
  const NAV = [
    { to: "/admin/overview", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/verify", label: "Verify users", icon: UserCheck },
    { to: "/admin/fleet", label: "Fleet & fares", icon: Truck },
    { to: "/admin/finance", label: "Finance", icon: PiggyBank },
    { to: "/admin/settlements", label: "Settlements", icon: Landmark },
    { to: "/admin/staffs", label: "staffs", icon: Users },
  ];
  return (
    <RoleLayout
      role={user?.role ?? "admin"}
      nav={NAV}
      accentClass="bg-violet-500"
      user={{
        name: user?.fullName ?? "admin",
        initials: initials(user?.fullName),
      }}
    />
  );
}
