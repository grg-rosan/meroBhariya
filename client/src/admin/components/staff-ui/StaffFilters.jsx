// src/admin/staff/components/StaffFilters.jsx
import { Search } from 'lucide-react';
import { ROLE_FILTERS } from '../../../shared/constants/staffConstants';

export default function StaffFilters({ search, onSearch, roleFilter, onRole }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
        />
      </div>

      <div className="flex gap-1.5">
        {ROLE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => onRole(f.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              roleFilter === f.value
                ? 'bg-zinc-700 text-white'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}