// src/admin/staff/components/StaffEmpty.jsx
import { Users } from 'lucide-react';

export default function StaffEmpty({ hasFilters, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
        <Users size={20} className="text-zinc-600" />
      </div>
      <p className="text-sm text-zinc-500">
        {hasFilters ? 'No staff match your filters' : 'No staff accounts yet'}
      </p>
      {!hasFilters && (
        <button
          onClick={onAdd}
          className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          Add the first staff member →
        </button>
      )}
    </div>
  );
}