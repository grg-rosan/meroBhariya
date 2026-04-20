import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Truck } from "lucide-react";
import ProfileCard from "./ProfileCard"; // Ensure path is correct
import { useAuth } from "../../modules/auth/AuthContext";

export default function RoleLayout({ role, nav, accentClass, user }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log(error);
    } finally {
      navigate("/login");
    }
  };
  const handleChangePassword = async () => {
    navigate("/password/forgot");
  };

  return (
    <div className="flex h-screen bg-zinc-950 font-['DM_Sans',sans-serif] overflow-hidden">
      <aside className="w-56 flex flex-col bg-zinc-900 border-r border-zinc-800 shrink-0">
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded flex items-center justify-center ${accentClass}`}
            >
              <Truck size={14} className="text-white" />
            </div>
            <span className="text-white font-semibold tracking-tight text-lg">
              Porter
            </span>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? `${accentClass.replace("bg-", "bg-").replace("500", "500/10")} text-white font-medium`
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Profile Card Component */}
        <div className="p-3 border-t border-zinc-800">
          <ProfileCard
            user={user}
            role={role}
            accentClass={accentClass}
            onLogout={handleLogout}
            onChangePassword={handleChangePassword}
          />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-zinc-950">
        <Outlet />
      </main>
    </div>
  );
}
