import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Upload, Wallet, FileText, LogOut, Truck
} from 'lucide-react';

const NAV = [
  { to: 'dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { to: 'shipments',   label: 'Shipments',    icon: Package },
  { to: 'bulk-upload', label: 'Bulk upload',  icon: Upload },
  { to: 'cod-ledger',  label: 'COD ledger',   icon: Wallet },
  { to: 'manifests',   label: 'Manifests',    icon: FileText },
];

export default function MerchantLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-zinc-950 font-['DM_Sans',sans-serif] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col bg-zinc-900 border-r border-zinc-800 shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-rose-500 flex items-center justify-center">
              <Truck size={14} className="text-white" />
            </div>
            <span className="text-white font-semibold tracking-tight text-lg">Porter</span>
          </div>
          <div className="mt-2 text-xs text-zinc-500 font-medium uppercase tracking-wider">Merchant</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-rose-500/10 text-rose-400 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-center">
              HT
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-300 font-medium truncate">Himalayan Traders</p>
              <p className="text-[11px] text-zinc-500 truncate">merchant</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-all"
          >
            <LogOut size={13} /> Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-zinc-950">
        <Outlet />
      </main>
    </div>
  );
}