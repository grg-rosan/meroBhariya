const MAP = {
  PENDING:          { label: 'Pending',        cls: 'bg-amber-100 text-amber-800' },
  ASSIGNED:         { label: 'Assigned',        cls: 'bg-blue-100 text-blue-800' },
  PICKED_UP:        { label: 'Picked up',       cls: 'bg-indigo-100 text-indigo-800' },
  IN_HUB:           { label: 'At hub',          cls: 'bg-purple-100 text-purple-800' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', cls: 'bg-sky-100 text-sky-800' },
  DELIVERED:        { label: 'Delivered',        cls: 'bg-green-100 text-green-800' },
  CANCELLED:        { label: 'Cancelled',        cls: 'bg-red-100 text-red-800' },
  RETURNED:         { label: 'Returned',         cls: 'bg-orange-100 text-orange-800' },
};

export default function StatusBadge({ status }) {
  const { label, cls } = MAP[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}