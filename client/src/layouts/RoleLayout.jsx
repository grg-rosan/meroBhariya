import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Truck } from "lucide-react";
import ProfileCard from "../components/common/ProfileCard";
import ChangePasswordModal from "../components/modals/ChangePasswordModal";
import { useAuth } from "../modules/auth/AuthContext";

export default function RoleLayout({ role, nav, accentClass, user }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log(error);
    } finally {
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen font-['DM_Sans',sans-serif] overflow-hidden bg-gray-50 dark:bg-zinc-950">
      <aside className="w-56 flex flex-col bg-white dark:bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-zinc-800 shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded flex items-center justify-center ${accentClass}`}
            >
              <Truck size={14} className="text-white" />
            </div>
            <span className="text-gray-900 dark:text-white font-semibold tracking-tight text-lg">
              Porter
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-gray-100 dark:bg-gray-100 dark:bg-blue-950 text-gray-900 dark:text-white font-medium"
                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-blue-950"
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ProfileCard — theme toggle lives inside the popup menu */}
        <div className="p-3 border-t border-gray-200 dark:border-zinc-800 mt-auto">
          <ProfileCard
            user={user}
            role={role}
            accentClass={accentClass}
            onLogout={handleLogout}
            onChangePassword={() => setShowPasswordModal(true)}
          />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-zinc-950">
        <Outlet />
      </main>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}
