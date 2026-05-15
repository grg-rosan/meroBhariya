import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Menu, Truck, X } from "lucide-react";
import ProfileCard from "../components/common/ProfileCard";
import ChangePasswordModal from "../components/modals/ChangePasswordModal";
import { useAuth } from "../modules/auth/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

export default function RoleLayout({ role, nav, accentClass, user }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { tokens: t } = useAppTheme();
  const toast = useToast();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast({ message: error.message ?? "Logout failed", type: "error" });
    } finally {
      navigate("/login");
    }
  };

  const sidebar = (
    <>
      <div className={`px-5 py-5 border-b ${t.border}`}>
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded flex items-center justify-center ${accentClass}`}
          >
            <Truck size={14} className="text-white" />
          </div>
          <span className={`${t.text} font-semibold tracking-tight text-lg`}>
            Porter
          </span>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={() => setMobileNavOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive ? t.navActive : t.navIdle
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className={`p-3 border-t ${t.border} mt-auto`}>
        <ProfileCard
          user={user}
          role={role}
          accentClass={accentClass}
          onLogout={handleLogout}
          onChangePassword={() => {
            setShowPasswordModal(true);
            setMobileNavOpen(false);
          }}
        />
      </div>
    </>
  );

  return (
    <div className={`flex h-screen font-['DM_Sans',sans-serif] overflow-hidden ${t.bg}`}>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex w-56 flex-col border-r shrink-0 ${t.sidebar}`}
      >
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside
            className={`relative flex flex-col w-72 max-w-[85vw] h-full border-r ${t.sidebar}`}
          >
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className={`absolute top-4 right-4 p-2 rounded-lg ${t.hover} ${t.sub}`}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <header
          className={`lg:hidden flex items-center gap-3 px-4 py-3 border-b shrink-0 ${t.sidebar}`}
        >
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className={`p-2 rounded-lg ${t.hover} ${t.sub}`}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className={`${t.text} font-semibold`}>Porter</span>
        </header>

        <main className={`flex-1 overflow-y-auto min-w-0 ${t.bg}`}>
          <Outlet />
        </main>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}
