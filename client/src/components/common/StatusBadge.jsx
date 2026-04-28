const MAP = {
  PENDING:          { label: 'Pending',          cls: 'bg-amber-500/10 text-amber-400' },
  ASSIGNED:         { label: 'Assigned',          cls: 'bg-blue-500/10 text-blue-400' },
  PICKED_UP:        { label: 'Picked up',         cls: 'bg-indigo-500/10 text-indigo-400' },
  IN_HUB:           { label: 'At hub',            cls: 'bg-purple-500/10 text-purple-400' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery',  cls: 'bg-sky-500/10 text-sky-400' },
  DELIVERED:        { label: 'Delivered',         cls: 'bg-green-500/10 text-green-400' },
  CANCELLED:        { label: 'Cancelled',         cls: 'bg-red-500/10 text-red-400' },
  RETURNED:         { label: 'Returned',          cls: 'bg-orange-500/10 text-orange-400' },
};

export default function StatusBadge({ status }) {
  const { label, cls } = MAP[status] ?? { label: status, cls: 'bg-zinc-700 text-zinc-300' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>
  );
}