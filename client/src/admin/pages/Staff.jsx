// src/admin/pages/Staff.jsx
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStaffManager } from '../hooks/useStaff';
import StaffStats from '../components/staff-ui/StaffStats';
import StaffFilters      from '../components/staff-ui/StaffFilters';
import StaffRow          from '../components/staff-ui/StaffRow';
import StaffEmpty        from '../components/staff-ui/StaffEmpty';
import CreateStaffModal  from '../components/staff-ui/CreateStaffModal';

export default function Staff() {
  const { list, loading, counts, toggling, handleToggle, handleCreate } = useStaffManager();
  const [search,     setSearch]  = useState('');
  const [roleFilter, setRole]    = useState('ALL');
  const [showModal,  setModal]   = useState(false);

  const filtered = list.filter(m => {
    const matchRole   = roleFilter === 'ALL' || m.role === roleFilter;
    const matchSearch = !search ||
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const hasFilters = !!search || roleFilter !== 'ALL';

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Staff</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage admin and dispatcher accounts</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={15} />
          Add staff
        </button>
      </div>

      <StaffStats counts={counts} />

      <StaffFilters
        search={search}       onSearch={setSearch}
        roleFilter={roleFilter} onRole={setRole}
      />

      {/* list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <StaffEmpty hasFilters={hasFilters} onAdd={() => setModal(true)} />
      ) : (
        <div className="space-y-2">
          {filtered.map(m => (
            <StaffRow
              key={m.id}
              member={m}
              onToggle={handleToggle}
              isToggling={toggling === m.id}
            />
          ))}
        </div>
      )}

      {showModal && (
        <CreateStaffModal
          onClose={() => setModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}