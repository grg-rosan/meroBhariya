// src/admin/staff/components/StaffStats.jsx

export default function StaffStats({ counts }) {
  const pills = [
    { label: 'Total staff',  value: counts.total,       color: 'text-white' },
    { label: 'Admins',       value: counts.admins,      color: 'text-violet-400' },
    { label: 'Dispatchers',  value: counts.dispatchers, color: 'text-sky-400' },
    { label: 'Active',       value: counts.active,      color: 'text-green-400' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {pills.map(p => (
        <div key={p.label} className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className={`text-2xl font-semibold ${p.color}`}>{p.value}</span>
          <span className="text-xs text-zinc-500">{p.label}</span>
        </div>
      ))}
    </div>
  );
}