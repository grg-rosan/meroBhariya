import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Truck } from "lucide-react";
import ProfileCard from "../components/common/ProfileCard";
import ChangePasswordModal from "../components/modals/ChangePasswordModal";
import { useAuth } from "../modules/auth/AuthContext";

export default function RoleLayout({ role, nav, accentClass, user }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false); // ✅ added

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
    <div className="flex h-screen bg-zinc-950 font-['DM_Sans',sans-serif] overflow-hidden">
      <aside className="w-56 flex flex-col bg-zinc-900 border-r border-zinc-800 shrink-0">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded flex items-center justify-center ${accentClass}`}>
              <Truck size={14} className="text-white" />
            </div>
            <span className="text-white font-semibold tracking-tight text-lg">
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
                    ? "bg-zinc-800 text-white font-medium"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ProfileCard pinned to bottom ✅ */}
        <div className="p-3 border-t border-zinc-800 mt-auto">
          <ProfileCard
            user={user}
            role={role}
            accentClass={accentClass}
            onLogout={handleLogout}
            onChangePassword={() => setShowPasswordModal(true)} // ✅ opens modal
          />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-zinc-950">
        <Outlet />
      </main>

      {/* Modal renders at root level, always centered ✅ */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}