import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Truck } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

export default function RoleLayout({ role, nav, accentClass, user }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-zinc-950 font-['DM_Sans',sans-serif] overflow-hidden">
      <aside className="w-56 flex flex-col bg-zinc-900 border-r border-zinc-800 shrink-0">
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className={"w-7 h-7 rounded flex items-center justify-center " + accentClass}>
              <Truck size={14} className="text-white" />
            </div>
            <span className="text-white font-semibold tracking-tight text-lg">Porter</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500 font-medium uppercase tracking-wider">{role}</div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ' +
                (isActive ? accentClass.replace('bg-','bg-') + '/10 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800')
              }
            >
              <Icon size={15} />{label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white " + accentClass}>
              {user?.initials ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-300 font-medium truncate">{user?.name ?? 'User'}</p>
              <p className="text-[11px] text-zinc-500 truncate">{role.toLowerCase()}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-all">
            <LogOut size={13} /> Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-zinc-950">
        <Outlet />
      </main>
    </div>
  );
}
